import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import fs from "fs";
import type { User, UserRole } from "../entities/User.js";

const DEV_BYPASS_TOKENS = ["test", "test-admin", "test-employee"] as const;

export type FirebaseUserLike = admin.auth.DecodedIdToken & {
  role?: string;
  companyId?: string;
  company_id?: string;
  status?: string;
};

export type AuthContext = {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  role: UserRole;
  companyId: string;
  status: "active" | "suspended" | "deleted";
  isPrivileged: boolean;
  isTrial: boolean;
  trialExpiresAt?: string;
  isTrialExpired: boolean;
};

export const DEFAULT_COMPANY_ID = "tempos-demo";

/**
 * Inicialización segura de Firebase Admin
 */
function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "./firebase-key.json";
  if (fs.existsSync(keyPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(keyPath),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log("✅ Firebase Admin (Service Account)");
  } else {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "tempos-project-f1e77",
    });
    console.log("✅ Firebase Admin (ADC/Default)");
  }
}

initFirebaseAdmin();

export const firebaseAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const isDev = process.env.NODE_ENV !== "production";

  // 1. Manejo de falta de cabecera
  if (!authHeader?.startsWith("Bearer ")) {
    if (isDev) {
      req.firebaseUser = getDevBypassFirebaseUser("test-admin") as any;
      return next();
    }
    res.status(401).json({ error: "Autorización requerida" });
    return;
  }

  const idToken = authHeader.substring(7);
  const isTestToken = DEV_BYPASS_TOKENS.includes(idToken as any);

  // 2. Bypass para testers (habilitado también en producción para fase de pruebas)
  if (isDev || isTestToken) {
    const bypassUser = getDevBypassFirebaseUser(idToken);
    if (bypassUser) {
      req.firebaseUser = bypassUser as any;
      return next();
    }
  }

  // 3. Verificación Real
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decodedToken as FirebaseUserLike;
    next();
  } catch (err) {
    if (isDev) {
      // Rescue mode para tokens caducados en local
      const payload = tryUnsafeDecode(idToken);
      if (payload) {
        req.firebaseUser = payload as any;
        return next();
      }
    }
    console.error("Auth Error:", err);
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};

function tryUnsafeDecode(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    // Mapeo de compatibilidad con Firebase SDK
    if (payload && !payload.uid && (payload.user_id || payload.sub)) {
      payload.uid = payload.user_id || payload.sub;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getDevBypassFirebaseUser(
  token: string,
): Record<string, any> | null {
  if (!DEV_BYPASS_TOKENS.includes(token as any)) return null;
  const isAdmin = token === "test-admin" || token === "test";

  return {
    uid: isAdmin ? "dev-admin-uid" : "dev-employee-uid",
    email: isAdmin ? "admin@tempos.es" : "user@tempos.es",
    name: isAdmin ? "Admin Local" : "User Local",
    admin: isAdmin,
    role: isAdmin ? "admin" : "employee",
    companyId: DEFAULT_COMPANY_ID,
    status: "active",
    email_verified: true,
  };
}

export function buildAuthContext(
  firebaseUser: FirebaseUserLike,
  currentUser?: Partial<User>,
): AuthContext {
  const role = (currentUser?.role ||
    firebaseUser.role ||
    (firebaseUser.admin ? "admin" : "employee")) as UserRole;
  const companyId =
    currentUser?.companyId ||
    firebaseUser.companyId ||
    firebaseUser.company_id ||
    DEFAULT_COMPANY_ID;

  const isTrial = !!currentUser?.metadata?.isTrial;
  const trialExpiresAt = currentUser?.metadata?.trialExpiresAt;
  const isTrialExpired = isTrial && trialExpiresAt ? new Date() > new Date(trialExpiresAt) : false;

  return {
    uid: firebaseUser.uid,
    email: currentUser?.email || firebaseUser.email || "",
    displayName: currentUser?.displayName || firebaseUser.name || "Usuario",
    emailVerified:
      currentUser?.emailVerified || firebaseUser.email_verified || false,
    role,
    companyId,
    status: (currentUser?.status as any) || "active",
    isPrivileged: role === "admin" || role === "manager" || role === "auditor",
    isTrial,
    trialExpiresAt,
    isTrialExpired,
  };
}
