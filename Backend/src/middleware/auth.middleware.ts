import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import fs from 'fs';
import type { User, UserRole } from '../entities/User.js';

const DEV_BYPASS_TOKENS = ['test', 'test-admin', 'test-employee'] as const;
type DevBypassToken = (typeof DEV_BYPASS_TOKENS)[number];
export type FirebaseUserLike = Record<string, unknown> & {
  uid: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
  admin?: boolean;
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
  status: 'active' | 'suspended' | 'deleted';
  isPrivileged: boolean;
};

export const DEFAULT_COMPANY_ID = 'tempos-demo';

export function normalizeUserRole(input: unknown): UserRole {
  if (input === 'admin' || input === 'manager' || input === 'auditor') {
    return input;
  }

  return 'employee';
}

export function normalizeCompanyId(input: unknown): string {
  if (typeof input !== 'string') return DEFAULT_COMPANY_ID;

  const normalized = input.trim().toLowerCase();
  return normalized.length > 0 ? normalized : DEFAULT_COMPANY_ID;
}

export function buildAuthContext(firebaseUser: FirebaseUserLike, currentUser?: Pick<User, 'email' | 'displayName' | 'emailVerified' | 'role' | 'companyId' | 'status'>): AuthContext {
  const role = normalizeUserRole(currentUser?.role ?? firebaseUser.role ?? (firebaseUser.admin === true ? 'admin' : 'employee'));
  const companyId = normalizeCompanyId(currentUser?.companyId ?? firebaseUser.companyId ?? firebaseUser.company_id);
  const status = currentUser?.status ?? 'active';
  const email = currentUser?.email ?? firebaseUser.email ?? '';
  const displayName = currentUser?.displayName ?? firebaseUser.name ?? email;
  const emailVerified = currentUser?.emailVerified ?? firebaseUser.email_verified === true;

  return {
    uid: firebaseUser.uid,
    email,
    displayName,
    emailVerified,
    role,
    companyId,
    status,
    isPrivileged: role === 'admin' || role === 'manager' || role === 'auditor',
  };
}

// Inicializar Firebase Admin SDK
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-key.json';
const isDev = process.env.NODE_ENV !== 'production';

if (!admin.apps.length) {
  const keyExists = fs.existsSync(keyPath) && fs.statSync(keyPath).isFile();

  if (keyExists) {
    admin.initializeApp({
      credential: admin.credential.cert(keyPath as any),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('✅ Firebase Admin inicializado con service account');
  } else if (isDev) {
    console.warn('⚠️  Sin firebase-key.json — Auth desactivado en desarrollo (endpoints protegidos responden 503)');
  } else {
    // En producción, usar Application Default Credentials (Cloud Run las inyecta automáticamente)
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('✅ Firebase Admin inicializado con Application Default Credentials');
  }
}

export const firebaseAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // En desarrollo sin key → saltar auth para facilitar testing
  if (isDev && !admin.apps.length) {
    console.warn('🔓 [DEV] Auth bypassed — firebase-key.json no configurado');
    (req as any).firebaseUser = {
      uid: '00000000-0000-0000-0000-000000000001',
      email: 'dev@tempos.es',
      admin: true,
      role: 'admin',
      companyId: DEFAULT_COMPANY_ID,
      status: 'active',
    };
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Autorización requerida' });
    return;
  }

  const idToken = authHeader.substring(7);

  // Bypass local explícito: permite trabajar en local aunque haya service account cargada.
  // Nunca se aplica en producción.
  const devBypassUser = getDevBypassFirebaseUser(idToken, process.env.NODE_ENV);
  if (devBypassUser) {
    (req as any).firebaseUser = devBypassUser;
    next();
    return;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    (req as any).firebaseUser = decodedToken;
    next();
  } catch (err) {
    console.error('Firebase auth error:', err);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export function getDevBypassFirebaseUser(idToken: string, nodeEnv = process.env.NODE_ENV): Record<string, unknown> | null {
  const isDevEnv = nodeEnv !== 'production';
  if (!isDevEnv) return null;
  if (!DEV_BYPASS_TOKENS.includes(idToken as DevBypassToken)) return null;

  const isAdminLocal = idToken === 'test-admin';
  return {
    uid: isAdminLocal
      ? '00000000-0000-0000-0000-000000000001'
      : '00000000-0000-0000-0000-000000000002',
    email: isAdminLocal ? 'dev-admin@tempos.es' : 'dev-employee@tempos.es',
    name: isAdminLocal ? 'Dev Admin' : 'Dev Employee',
    admin: isAdminLocal,
    role: isAdminLocal ? 'admin' : 'employee',
    companyId: DEFAULT_COMPANY_ID,
    status: 'active',
    email_verified: true,
  };
}
