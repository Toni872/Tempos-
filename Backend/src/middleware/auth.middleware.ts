import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import fs from 'fs';

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

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    (req as any).firebaseUser = decodedToken;
    next();
  } catch (err) {
    console.error('Firebase auth error:', err);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
