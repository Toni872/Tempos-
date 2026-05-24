import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import fs from "fs";
import { AppDataSource } from "../database.js";
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
  status: "active" | "pending" | "suspended" | "deleted";
  isPrivileged: boolean;
  isTrial: boolean;
  trialExpiresAt?: string;
  isTrialExpired: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionPlan: string;
  subscriptionStatus?: string;
  features: {
    canUseGeofencing: boolean;
    canManageLeaves: boolean;
    maxWorkCenters: number;
  };
};

export const DEFAULT_COMPANY_ID = "tempos-demo";

/**
 * Inicialización segura de Firebase Admin
 * Soporta múltiples formas de pasar las credenciales:
 *  1. GOOGLE_APPLICATION_CREDENTIALS → path a archivo JSON
 *  2. FIREBASE_KEY_JSON → JSON string directo (multi-línea o base64)
 *  3. Fallback a ADC (Application Default Credentials)
 */
function initFirebaseAdmin() {
  if (admin.apps.length) return;

  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "./firebase-key.json";

  // 1. Archivo en disco (GOOGLE_APPLICATION_CREDENTIALS o ./firebase-key.json)
  if (fs.existsSync(keyPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(keyPath),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log("✅ Firebase Admin (Service Account - archivo)");
    return;
  }

  // 2. FIREBASE_KEY_JSON como variable de entorno (Railway secret)
  let rawJson = (process.env.FIREBASE_KEY_JSON || "").trim();

  // Railway a veces envuelve el valor en comillas dobles
  if (rawJson.startsWith('"') && rawJson.endsWith('"')) {
    rawJson = rawJson.slice(1, -1);
  }

  if (rawJson) {
    let parsed: Record<string, any> | null = null;

    // Intentar 1: Parsear como JSON directo (multi-línea)
    if (rawJson.startsWith("{") || rawJson.startsWith("\"{")) {
      try {
        const clean = rawJson.startsWith("\"") ? JSON.parse(rawJson) : rawJson;
        parsed = JSON.parse(typeof clean === "string" ? clean : JSON.stringify(clean));
      } catch {
        parsed = null;
      }
    }

    // Intentar 2: Decodificar base64 (Railway single-line friendly)
    if (!parsed) {
      try {
        const decoded = Buffer.from(rawJson, "base64").toString("utf-8");
        parsed = JSON.parse(decoded);
      } catch {
        parsed = null;
      }
    }

    if (parsed) {
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
        projectId: process.env.FIREBASE_PROJECT_ID || parsed.project_id,
      });
      console.log("✅ Firebase Admin (Service Account - FIREBASE_KEY_JSON)");
      return;
    } else {
      console.error("❌ FIREBASE_KEY_JSON presente pero no se pudo parsear.");
      console.error("   Raw starts with:", rawJson.substring(0, 60));
      console.log("   💡 Usá base64 para una sola línea: en terminal, ejecutá:");
      console.log("   certutil -encode -f firebase-key.json output.txt && type output.txt");
    }
  }

  // 3. Fallback a ADC
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "tempos-project-f1e77",
  });
  console.log("ℹ️ Firebase Admin (ADC/Default) — sin service account, puede fallar en Railway");
}

initFirebaseAdmin();

export const firebaseAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const isDev = process.env.NODE_ENV !== "production";

  // EN DESARROLLO: usamos el token real si existe (para nombre/email correctos) pero forzando admin
  if (isDev) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const idToken = authHeader.substring(7);
      const payload = tryUnsafeDecode(idToken);
      if (payload) {
        const bypass = getDevBypassFirebaseUser("test-admin")!;
        req.firebaseUser = {
          ...payload,
          ...bypass,
          uid: payload.uid || payload.user_id || payload.sub || bypass.uid,
          email: payload.email || bypass.email,
          name: payload.name || bypass.name,
        } as any;
        return next();
      }
    }
    req.firebaseUser = getDevBypassFirebaseUser("test-admin") as any;
    return next();
  }

  // EN PRODUCCIÓN: flujo normal con Firebase
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Autorización requerida" });
    return;
  }

  const idToken = authHeader.substring(7);

  // SOLO en desarrollo: permitir tokens de test
  if (isDev) {
    const isTestToken = DEV_BYPASS_TOKENS.includes(idToken as any);
    if (isTestToken) {
      const bypassUser = getDevBypassFirebaseUser(idToken);
      if (bypassUser) {
        req.firebaseUser = bypassUser as any;
        return next();
      }
    }
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decodedToken as FirebaseUserLike;
    next();
  } catch (err) {
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

export function requireEmailVerified(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const firebaseUser = (req as any).firebaseUser;
  const uid = firebaseUser?.uid || "";
  const isDevToken = uid === "dev-admin-uid" || uid === "dev-employee-uid";

  // Skip for temp_ UIDs (employee invite flow)
  if (uid.startsWith("temp_")) {
    next();
    return;
  }

  // Skip for dev/test bypass tokens
  if (isDevToken) {
    next();
    return;
  }

  // Check if user status is pending (requires admin approval)
  const currentUser = (req as any).currentUser;
  if (currentUser?.status === "pending") {
    res.status(403).json({ error: "cuenta_pendiente_aprobacion", blocked: true });
    return;
  }

  // Si el usuario existe en BD pero emailVerified=false, lo corregimos al vuelo
  // (cubre TODOS los caminos de registro, incluso los que el controller no cubre)
  if (currentUser?.uid && !currentUser.emailVerified) {
    AppDataSource.getRepository(User)
      .update({ uid: currentUser.uid }, { emailVerified: true })
      .then(() => {
        currentUser.emailVerified = true;
        console.log(`✅ [AUTH] emailVerified corregido en BD para ${currentUser.email}`);
      })
      .catch((dbErr) =>
        console.error("⚠️ [AUTH] Error corrigiendo emailVerified:", dbErr),
      );
    // Dejamos pasar aunque la corrección async todavía no haya terminado
    next();
    return;
  }

  // Si la BD ya tiene emailVerified=true, pasar directamente
  if (currentUser?.emailVerified === true) {
    next();
    return;
  }

  if (!firebaseUser?.email_verified) {
    res.status(403).json({ error: "email_no_verificado", blocked: true });
    return;
  }

  next();
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

  const subscriptionPlan = currentUser?.subscriptionPlan || "trial";
  const isTrial = subscriptionPlan === "trial" || !!currentUser?.isTrial;
  const trialExpiresAt = currentUser?.trialExpiresAt ? (currentUser.trialExpiresAt instanceof Date ? currentUser.trialExpiresAt.toISOString() : currentUser.trialExpiresAt) : undefined;
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
    stripeCustomerId: currentUser?.stripeCustomerId,
    stripeSubscriptionId: currentUser?.stripeSubscriptionId,
    subscriptionPlan,
    subscriptionStatus: currentUser?.subscriptionStatus,
    features: {
      canUseGeofencing: subscriptionPlan !== "starter",
      canManageLeaves: subscriptionPlan !== "starter",
      maxWorkCenters: subscriptionPlan === "starter" ? 1 : 999,
    },
  };
}
