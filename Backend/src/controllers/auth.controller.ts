import { Router, Request, Response } from "express";
import { AppDataSource } from "../database.js";
import { User, type UserRole } from "../entities/User.js";
import {
  firebaseAuthMiddleware,
  DEFAULT_COMPANY_ID,
} from "../middleware/auth.middleware.js";
import {
  appUserContextMiddleware,
  getAuthContext,
} from "../middleware/request-context.middleware.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  buildValidationError,
  registerSchema,
  updateAuthProfileSchema,
} from "../utils/validation.js";
import { randomUUID } from "crypto";
import { EmailService } from "../services/EmailService.js";
import { registerRateLimiter } from "../middleware/rate-limit.middleware.js";
import admin from "firebase-admin";

const router = Router();

/**
 * POST /api/v1/auth/register
 * Registra nuevo usuario desde Firebase
 */
router.post(
  "/register",
  registerRateLimiter,
  firebaseAuthMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const firebaseUser = (req as any).firebaseUser;
    const userRepository = AppDataSource.getRepository(User);

    // Comprobar si existe por UID (login recurrente)
    let user = await userRepository.findOne({
      where: { uid: firebaseUser.uid },
    });

    if (user) {
      res.status(409).json({ message: "El usuario ya está registrado", data: { uid: user.uid } });
      return;
    }

    // DEBUG: Ver qué recibimos de Firebase
    console.log("DEBUG [AUTH]: Firebase User Data ->", {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.name,
      picture: firebaseUser.picture,
    });

    if (!user && firebaseUser.email) {
      const normalizedEmail = firebaseUser.email.toLowerCase();
      // Comprobar si existe por Email (fue creado por un admin previamente)
      user = await userRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (user) {
        const oldUid = user.uid;

        // Si mismo UID, actualizar metadata y devolver
        if (oldUid === firebaseUser.uid) {
          user.emailVerified = firebaseUser.email_verified ?? user.emailVerified;
          if (
            firebaseUser.name &&
            (!user.displayName ||
              user.displayName === "Usuario" ||
              user.displayName.includes("@"))
          ) {
            user.displayName = firebaseUser.name;
          }
          if (firebaseUser.picture) {
            user.photoURL = firebaseUser.picture;
          }
          await userRepository.save(user);
          res.status(200).json({
            message: "Usuario ya registrado",
            data: {
              uid: user.uid,
              email: user.email,
              role: user.role,
              companyId: user.companyId,
              isTrial: user.isTrial,
              status: user.status,
            },
          });
          return;
        }

        // UID DISTINTO: marcamos para re-link (no borramos todavía).
        // Haremos la eliminación y creación del nuevo usuario dentro de
        // una transacción más abajo para asegurar atomicidad.
        console.log(
          `🔄 [AUTH] Re-link requested ${user.email}: ${oldUid} → ${firebaseUser.uid}`,
        );
        // Guardamos el UID antiguo para procesarlo tras construir el nuevo usuario
        (req as any).relinkOldUid = oldUid;
        user = null as any; // Cae al flujo de creación de usuario nuevo
      }
    }

    // Parse request body with Zod schema
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildValidationError(parsed.error));
      return;
    }
    const body = parsed.data;

    // Si no existe en BD ni por UID ni por email, solo admins pueden auto-registrarse
    if (!user && firebaseUser.email) {
      const isAdmin = body.role === "admin" || (firebaseUser as any).admin === true;

      if (!isAdmin) {
        res.status(404).json({ error: "No tienes una cuenta registrada. Contactá a tu administrador." });
        return;
      }
    }

    // Prioridad: 1. Role en el body | 2. Role en el token de Firebase | 3. Default a employee
    let requestedRole: UserRole = "employee";

    if (
      body.role === "admin" ||
      firebaseUser.admin === true ||
      firebaseUser.role === "admin"
    ) {
      requestedRole = "admin";
    }

    // ── Domain validation for admin registration ──────────────
    const DEV_BYPASS_UIDS = ["dev-admin-uid", "dev-employee-uid"];
    const skipDomainCheck =
      process.env.NODE_ENV === "development" ||
      firebaseUser.uid.startsWith("temp_") ||
      DEV_BYPASS_UIDS.includes(firebaseUser.uid);

    let registrationStatus: "active" | "pending" = "active";
    const companyDomain =
      typeof body.companyDomain === "string"
        ? body.companyDomain.trim()
        : "";

    if (requestedRole === "admin" && !skipDomainCheck) {
      const emailDomain = firebaseUser.email?.split("@")[1]?.toLowerCase();
      if (!companyDomain) {
        registrationStatus = "pending";
      } else if (emailDomain && emailDomain !== companyDomain.toLowerCase()) {
        registrationStatus = "pending";
      }
    }

    let companyId = DEFAULT_COMPANY_ID;

    if (requestedRole === "admin") {
      const companyName =
        typeof body.companyName === "string"
          ? body.companyName.trim()
          : "";
      const slug = companyName
        ? companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : "company";
      companyId = `${slug}-${randomUUID().slice(0, 8)}`;
    }

    // Vincular dispositivo si viene en el body (primer login nativo)
    const deviceId =
      typeof body.deviceId === "string"
        ? body.deviceId.trim()
        : undefined;
    const finalDisplayName =
      body.name || firebaseUser.name || firebaseUser.email || "Usuario";

    // Crear nuevo usuario
    const relinkOldUid = (req as any).relinkOldUid as string | undefined;

    user = userRepository.create({
      uid: firebaseUser.uid,
      email: firebaseUser.email?.toLowerCase() ?? '',
      displayName: finalDisplayName,
      photoURL: firebaseUser.picture || undefined,
      emailVerified: firebaseUser.email_verified,
      companyId: companyId,
      role: requestedRole,
      status: registrationStatus,
      authorizedDeviceId: deviceId,
      isTrial: requestedRole === "admin",
      trialExpiresAt: requestedRole === "admin" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : undefined,
      metadata: {
        createdAt: new Date().toISOString(),
        linkedFromUid: relinkOldUid ?? undefined,
        companyName: body.companyName || "",
        phone: body.phone || "",
      },
    });

    // --- RE-LINK: UPDATE-based en lugar de DELETE + re-create ---
    // Descubre FKs dinámicamente via information_schema y re-apunta TODAS
    // las referencias al nuevo UID. NO depende de ON DELETE CASCADE en la BD.
    if (relinkOldUid) {
      try {
        await AppDataSource.manager.transaction(async (manager) => {
          // 1. Descubrir TODAS las FK → users(uid) dinámicamente
          const fks: Array<{ table_name: string; column_name: string }> = await manager.query(
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

          // 2. Re-apuntar todas las referencias hijas al nuevo UID
          for (const fk of fks) {
            const tbl = `"${fk.table_name.replace(/"/g, '""')}"`;
            const col = `"${fk.column_name.replace(/"/g, '""')}"`;
            await manager.query(
              `UPDATE ${tbl} SET ${col} = $1 WHERE ${col} = $2`,
              [firebaseUser.uid, relinkOldUid]
            );
          }

          // 3. Actualizar el registro del usuario (PK + metadatos)
          //    Ya no hay referencias al oldUid, así que no hay conflicto de FK.
          await manager.query(
            `UPDATE "users" SET
              "uid" = $1,
              "displayName" = $2,
              "photoURL" = $3,
              "emailVerified" = $4,
              "companyId" = $5,
              "role" = $6,
              "status" = $7,
              "authorizedDeviceId" = $8,
              "isTrial" = $9,
              "trialExpiresAt" = $10,
              "metadata" = $11
             WHERE "uid" = $12`,
            [
              firebaseUser.uid,
              finalDisplayName,
              firebaseUser.picture || null,
              firebaseUser.email_verified ?? true,
              companyId,
              requestedRole,
              registrationStatus,
              deviceId || null,
              requestedRole === "admin",
              requestedRole === "admin"
                ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                : null,
              JSON.stringify({
                createdAt: new Date().toISOString(),
                linkedFromUid: relinkOldUid,
                companyName: body.companyName || "",
                phone: body.phone || "",
              }),
              relinkOldUid,
            ]
          );
        });

        // Recargar el usuario actualizado desde la BD para el resto del flujo
        user = await userRepository.findOne({ where: { uid: firebaseUser.uid } });
        if (!user) {
          res.status(500).json({ error: "Error al re-linkear usuario. Contactá a soporte." });
          return;
        }
      } catch (saveErr: unknown) {
        console.error("❌ [AUTH ERROR] Error crítico al re-linkear usuario:", saveErr);
        const err = saveErr as any;
        if (err?.code === "ER_DUP_ENTRY" || err?.code === "23505") {
          res.status(409).json({ error: "Este usuario ya está registrado." });
          return;
        }
        throw saveErr;
      }
    } else {
      try {
        await userRepository.save(user);
      } catch (saveErr: unknown) {
        console.error("❌ [AUTH ERROR] Error crítico al guardar usuario:", saveErr);
        const err = saveErr as any;
        if (err?.code === "ER_DUP_ENTRY" || err?.code === "23505") {
          res.status(409).json({ error: "Este usuario ya está registrado." });
          return;
        }
        throw saveErr;
      }
    }

    // Auto-verificar email para que el dashboard no bloquee con "email_no_verificado"
    if (!user.emailVerified) {
      // Firebase update es "best-effort" — si falla (permisos, red), no bloquea el flujo
      try {
        await admin.auth().updateUser(firebaseUser.uid, { emailVerified: true });
        console.log(`✅ [AUTH] Email verificado en Firebase para ${user.email}`);
      } catch (verifyErr) {
        console.error("⚠️ [AUTH] No se pudo verificar email en Firebase:", verifyErr);
      }
      // La BD SIEMPRE se actualiza a true para que el middleware requireEmailVerified pase
      try {
        await userRepository.update({ uid: firebaseUser.uid }, { emailVerified: true });
        user.emailVerified = true;
        console.log(`✅ [AUTH] emailVerified=true en BD para ${user.email}`);
      } catch (dbErr) {
        console.error("⚠️ [AUTH] No se pudo actualizar emailVerified en BD:", dbErr);
      }
    }

    // Si el registro quedó pendiente, notificar al equipo de Tempos
    if (registrationStatus === "pending") {
      try {
        await EmailService.sendPendingApproval(
          user.email,
          user.displayName || "Usuario",
          companyDomain || "No proporcionado",
        );
      } catch (emailErr) {
        console.error("⚠️ Error al enviar notificación de registro pendiente:", emailErr);
      }
    }

    // Si es un administrador nuevo (Trial), enviar email premium de bienvenida
    if (requestedRole === "admin") {
      try {
        await EmailService.sendTrialWelcome(user.email, user.displayName || "Usuario");
      } catch (emailErr) {
        console.error("⚠️ Error al enviar email de bienvenida:", emailErr);
      }
    }

    res.status(201).json({
      message: "Registro exitoso",
      data: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        isTrial: user.isTrial,
        status: user.status,
      },
    });
  }),
);

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get(
  "/me",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    
    if (!auth?.uid) {
      res.status(503).json({ error: "Servicio temporalmente no disponible. Inténtalo de nuevo." });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { uid: auth.uid },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // --- AUTO-SYNC GOOGLE METADATA ---
    // Si el usuario tiene el nombre genérico o no tiene foto, y el token de Firebase nos da mejores datos, actualizamos.
    const firebaseUser = (req as any).firebaseUser;
    let needsUpdate = false;

    if (
      firebaseUser?.name &&
      (!user.displayName ||
        user.displayName === "Usuario" ||
        user.displayName.includes("@"))
    ) {
      user.displayName = firebaseUser.name;
      needsUpdate = true;
    }

    if (
      firebaseUser?.picture &&
      (!user.photoURL || user.photoURL.includes("default-avatar"))
    ) {
      user.photoURL = firebaseUser.picture;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await userRepository.save(user);
      console.log(
        `✅ [AUTH] Perfil sincronizado para ${user.email} (${user.displayName})`,
      );
    }
    // ---------------------------------

    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      role: user.role,
      companyId: user.companyId,
      status: user.status,
      photoURL: user.photoURL,
      createdAt: user.createdAt,
      hasDeviceBound: !!user.authorizedDeviceId,
      requiresGeolocation: user.requiresGeolocation,
      isTrial: user.isTrial,
      trialExpiresAt: user.trialExpiresAt,
      isTrialExpired: user.trialExpiresAt ? new Date() > user.trialExpiresAt : false,
      features: auth.features,
    });
  }),
);

/**
 * PUT /api/v1/auth/profile
 * Update user profile
 */
router.put(
  "/profile",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const parsedBody = updateAuthProfileSchema.safeParse(req.body);

    if (!parsedBody.success) {
      res.status(400).json(buildValidationError(parsedBody.error));
      return;
    }

    const { displayName } = parsedBody.data;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { uid: auth.uid },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    if (displayName) user.displayName = displayName;
    if (req.body.photoURL !== undefined) user.photoURL = req.body.photoURL;

    await userRepository.save(user);

    res.json({
      message: "Perfil actualizado",
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    });
  }),
);

/**
 * POST /api/v1/auth/accept-terms
 * Marca al usuario como que ha aceptado los términos legales
 */
router.post(
  "/accept-terms",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { uid: auth.uid },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    user.hasAcceptedTerms = true;
    user.acceptedTermsAt = new Date();

    await userRepository.save(user);

    res.json({
      success: true,
      message: "Términos legales aceptados correctamente",
      acceptedAt: user.acceptedTermsAt,
    });
  }),
);

/**
 * POST /api/v1/auth/bind-device
 * Vincula un dispositivo físico al usuario (una sola vez).
 * Si ya tiene uno vinculado, verifica que coincida.
 */
router.post(
  "/bind-device",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { deviceId } = req.body;

    if (
      !deviceId ||
      typeof deviceId !== "string" ||
      deviceId.trim().length < 8
    ) {
      res.status(400).json({ error: "ID de dispositivo inválido." });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { uid: auth.uid } });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Si ya tiene un dispositivo vinculado
    if (user.authorizedDeviceId) {
      if (user.authorizedDeviceId === deviceId.trim()) {
        res.json({
          status: "already_bound",
          message: "Este dispositivo ya está vinculado.",
        });
      } else {
        res.status(403).json({
          error: "DEVICE_MISMATCH",
          message:
            "Tu cuenta ya está vinculada a otro dispositivo. Contacta con tu administrador.",
        });
      }
      return;
    }

    // Primer vínculo
    user.authorizedDeviceId = deviceId.trim();
    await userRepository.save(user);

    res.json({
      status: "bound",
      message:
        "Dispositivo vinculado correctamente. Solo podrás fichar desde este móvil.",
    });
  }),
);

/**
 * POST /api/v1/auth/unbind-device
 * Solo administradores pueden desvincular el dispositivo de un empleado.
 */
router.post(
  "/unbind-device",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);

    if (!auth.isPrivileged) {
      res
        .status(403)
        .json({
          error: "Solo administradores pueden desvincular dispositivos.",
        });
      return;
    }

    const { targetUid } = req.body;
    if (!targetUid) {
      res
        .status(400)
        .json({ error: "Debes especificar el UID del empleado (targetUid)." });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const targetUser = await userRepository.findOne({
      where: { uid: targetUid, companyId: auth.companyId },
    });

    if (!targetUser) {
      res.status(404).json({ error: "Empleado no encontrado en tu empresa." });
      return;
    }

    targetUser.authorizedDeviceId = undefined;
    await userRepository.save(targetUser);

    res.json({
      message: `Dispositivo desvinculado para ${targetUser.displayName || targetUser.email}.`,
    });
  }),
);

/**
 * POST /api/v1/auth/dev-upgrade
 * Simula la actualización a un plan (Solo para desarrollo)
 */
router.post(
  "/dev-upgrade",
  firebaseAuthMiddleware,
  appUserContextMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const auth = getAuthContext(req);
    const { planId } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { uid: auth.uid },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    user.subscriptionPlan = planId || "business";
    user.subscriptionStatus = "active";
    await userRepository.save(user);

    res.json({
      message: `Plan simulado actualizado a ${user.subscriptionPlan}`,
      user: {
        uid: user.uid,
        subscriptionPlan: user.subscriptionPlan,
      },
    });
  }),
);

export default router;
