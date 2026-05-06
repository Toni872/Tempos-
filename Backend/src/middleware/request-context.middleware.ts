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

      // INGENIERÍA SENIOR: Auto-registro de usuario si no existe en la DB local
      if (!currentUser && firebaseUser.email) {
        console.log("🆕 [CONTEXT] Auto-registrando usuario:", firebaseUser.email);
        currentUser = userRepo.create({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.name,
          role: "admin", // Le damos admin por defecto en dev
          status: "active",
          requiresGeolocation: false,
          requiresQR: false,
          companyId: "tempos-demo"
        });
        await userRepo.save(currentUser);
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
    next();
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
