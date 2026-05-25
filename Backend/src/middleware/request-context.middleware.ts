import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../database.js";
import { User, type UserRole } from "../entities/User.js";
import {
  buildAuthContext,
  type AuthContext,
  type FirebaseUserLike,
} from "./auth.middleware.js";
import { hasPermission, type Permission } from "../security/authorization.js";

export async function appUserContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const firebaseUser = (req as any).firebaseUser as
    | FirebaseUserLike
    | undefined;
  if (!firebaseUser) {
    next();
    return;
  }

  try {
    let currentUser: User | null = null;
    if (AppDataSource.isInitialized) {
      const userRepo = AppDataSource.getRepository(User);
      currentUser = await userRepo.findOne({
        where: { uid: firebaseUser.uid },
      });

      // En desarrollo: si el usuario existe pero tiene role employee, lo subimos a admin
      if (currentUser && process.env.NODE_ENV !== "production") {
        const bypassRole = firebaseUser.role || (firebaseUser.admin ? "admin" : null);
        if (bypassRole && currentUser.role !== bypassRole) {
          currentUser.role = bypassRole as UserRole;
          await userRepo.save(currentUser);
        }
      }

      // Auto-activar usuarios "pending" con sesión Firebase válida
      // El status "pending" queda cuando el admin se registra sin dominio corporativo,
      // pero si ya tiene un token Firebase válido, es un usuario legítimo.
      if (currentUser && currentUser.status === "pending") {
        currentUser.status = "active";
        await userRepo.save(currentUser);
        console.log(`✅ [MIDDLEWARE] Usuario ${currentUser.email} auto-activado (pending→active)`);
      }

      // Si NO existe por UID, buscamos por email (UID cambió → re-link)
      if (!currentUser && firebaseUser.email) {
        const userByEmail = await userRepo.findOne({
          where: { email: firebaseUser.email },
        });

        if (userByEmail) {
          if (userByEmail.uid !== firebaseUser.uid) {
            // ── RE-LINK: UID cambió, migrar usuario al nuevo UID ──
            // Estrategia: 1) liberar email  2) INSERT nuevo  3) UPDATE hijos  4) DELETE viejo
            console.log(
              `🔄 [MIDDLEWARE] Re-link ${userByEmail.email}: ${userByEmail.uid} → ${firebaseUser.uid}`,
            );

            const fks: Array<{ table_name: string; column_name: string }> = await AppDataSource.manager.query(
              `SELECT tc.table_name::text AS table_name,
                      kcu.column_name::text AS column_name
               FROM information_schema.table_constraints tc
               JOIN information_schema.key_column_usage kcu
                 ON tc.constraint_name = kcu.constraint_name
                 AND tc.table_catalog = kcu.table_catalog
                 AND tc.table_schema = kcu.table_schema
               JOIN information_schema.constraint_column_usage ccu
                 ON tc.constraint_name = ccu.constraint_name
                 AND tc.table_catalog = ccu.table_catalog
                 AND tc.table_schema = ccu.table_schema
               WHERE tc.constraint_type = 'FOREIGN KEY'
                 AND ccu.table_name = 'users'
                 AND ccu.column_name = 'uid'`
            );

            const tempEmail = `relinked_${userByEmail.email.replace(/[@.]/g, '_')}_${crypto.randomUUID().slice(0, 8)}`;

            await AppDataSource.manager.transaction(async (manager) => {
              // 1. Liberar email del usuario viejo
              await manager.query(
                `UPDATE "users" SET "email" = $1 WHERE "uid" = $2`,
                [tempEmail, userByEmail.uid]
              );

              // 2. INSERT nuevo usuario con email ORIGINAL
              await manager.query(
                `INSERT INTO "users" (
                  "uid", "email", "displayName", "photoURL", "companyId", "role",
                  "status", "isTrial", "trialExpiresAt", "metadata",
                  "hasAutoClock", "hasAcceptedTerms", "hourlyRate", "overtimeRate",
                  "requiresGeolocation", "requiresQR", "subscriptionPlan",
                  "subscriptionStatus", "authorizedDeviceId", "isAutoClockEnabled",
                  "invitationToken", "invitationExpiresAt", "emailVerified"
                ) VALUES (
                  $1, $2, $3, $4, $5, $6,
                  $7, $8, $9, $10::jsonb,
                  $11, $12, $13, $14,
                  $15, $16, $17,
                  $18, $19, $20,
                  $21, $22, true
                )`,
                [
                  firebaseUser.uid, userByEmail.email,
                  userByEmail.displayName, userByEmail.photoURL, userByEmail.companyId, userByEmail.role,
                  "active", userByEmail.isTrial, userByEmail.trialExpiresAt, JSON.stringify(userByEmail.metadata || {}),
                  userByEmail.hasAutoClock, userByEmail.hasAcceptedTerms, userByEmail.hourlyRate, userByEmail.overtimeRate,
                  userByEmail.requiresGeolocation, userByEmail.requiresQR, userByEmail.subscriptionPlan,
                  userByEmail.subscriptionStatus, userByEmail.authorizedDeviceId, userByEmail.isAutoClockEnabled,
                  userByEmail.invitationToken, userByEmail.invitationExpiresAt,
                ]
              );

              // 3. Re-apuntar hijos al nuevo UID
              for (const fk of fks) {
                const tbl = `"${fk.table_name.replace(/"/g, '""')}"`;
                const col = `"${fk.column_name.replace(/"/g, '""')}"`;
                await manager.query(
                  `UPDATE ${tbl} SET ${col} = $1 WHERE ${col} = $2`,
                  [firebaseUser.uid, userByEmail.uid]
                );
              }

              // 4. Eliminar usuario viejo
              await manager.getRepository(User).delete({ uid: userByEmail.uid });
            });

            currentUser = await userRepo.findOne({
              where: { uid: firebaseUser.uid },
            });
          } else {
            // Mismo UID, solo actualizar metadata
            if (firebaseUser.picture) userByEmail.photoURL = firebaseUser.picture;
            if (firebaseUser.name) userByEmail.displayName = firebaseUser.name;
            currentUser = await userRepo.save(userByEmail);
          }
        } else if (process.env.NODE_ENV !== "production") {
          console.warn(
            `⚠️ [DEV] Usuario ${firebaseUser.email} no encontrado en DB. ` +
              `Creando usuario temporal para desarrollo.`,
          );
          currentUser = userRepo.create({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.name || "Dev User",
            role: (firebaseUser.role || (firebaseUser.admin ? "admin" : "employee")) as UserRole,
            status: "active",
            requiresGeolocation: false,
            requiresQR: false,
            companyId: "tempos-demo",
          });
          await userRepo.save(currentUser);
        } else {
          _res.status(401).json({
            error: "Usuario no encontrado",
            code: "USER_NOT_FOUND",
            message:
              "No tienes acceso a Tempos. Contacta al administrador de tu empresa.",
          });
          return;
        }
      }
    }

    (req as any).currentUser = currentUser;
    (req as any).authContext = buildAuthContext(
      firebaseUser,
      currentUser ?? undefined,
    );
    next();
  } catch (err) {
    console.error("❌ [CONTEXT_MIDDLEWARE] Error crítico:", err);
    next(err);
  }
}

export function getAuthContext(req: Request): AuthContext {
  return (req as any).authContext as AuthContext;
}

export function requireRoles(
  req: Request,
  res: Response,
  roles: UserRole[],
): boolean {
  const auth = getAuthContext(req);
  if (!roles.includes(auth.role)) {
    res.status(403).json({ error: "Acción reservada para roles autorizados" });
    return false;
  }

  if (auth.status !== "active") {
    res.status(403).json({ error: "Usuario inactivo o suspendido" });
    return false;
  }

  return true;
}

export function requirePermission(
  req: Request,
  res: Response,
  permission: Permission,
): boolean {
  const auth = getAuthContext(req);
  if (!hasPermission(auth, permission)) {
    const message =
      auth.status !== "active"
        ? "Usuario inactivo o suspendido"
        : "Acción reservada para roles autorizados";
    res.status(403).json({ error: message });
    return false;
  }

  return true;
}

/**
 * Middleware para bloquear el acceso si el Trial ha expirado.
 */
export function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuthContext(req);

  // Guardia: si el middleware de contexto no pudo construir el auth (p.ej. BD caída),
  // devolvemos un 503 limpio en lugar de crashear con "Cannot read properties of undefined".
  if (!auth) {
    res.status(503).json({
      error: "SERVICE_UNAVAILABLE",
      message: "El servicio no está disponible temporalmente. Inténtalo de nuevo en unos segundos.",
    });
    return;
  }

  // Si está en periodo de prueba y ha expirado
  if (auth.subscriptionPlan === "trial" && auth.isTrialExpired) {
    res.status(402).json({
      error: "TRIAL_EXPIRED",
      message: "Tu periodo de prueba ha finalizado. Por favor, activa un plan para continuar.",
      trialExpiresAt: auth.trialExpiresAt
    });
    return;
  }

  // Si tiene un plan de pago pero no está activo ni en trialing (por ejemplo, cancelado o impago)
  if (auth.subscriptionPlan !== "trial") {
    const validStatuses = ["active", "trialing"];
    if (!auth.subscriptionStatus || !validStatuses.includes(auth.subscriptionStatus)) {
      res.status(402).json({
        error: "SUBSCRIPTION_INACTIVE",
        message: "Tu suscripción no está activa. Por favor, revisa tu facturación para continuar.",
        subscriptionStatus: auth.subscriptionStatus
      });
      return;
    }
  }

  next();
}
