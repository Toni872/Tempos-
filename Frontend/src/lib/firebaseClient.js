import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export async function signInAndGetIdToken(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user.getIdToken();
}

export async function signUpAndGetIdToken(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user.getIdToken();
}

/**
 * Envía el email de verificación al usuario actualmente autenticado.
 */
export async function sendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay usuario autenticado.');
  await sendEmailVerification(user, {
    url: `${window.location.origin}/verify-email`,
    handleCodeInApp: true,
  });
}

/**
 * Recarga el usuario actual para obtener el estado actualizado de emailVerified.
 */
export async function reloadCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;
  await user.reload();
  return auth.currentUser;
}

/**
 * Cierra la sesión del usuario autenticado.
 */
export const signOutUser = async () => {
  await signOut(auth);
};

export async function logout() {
  await signOut(auth);
}

/**
 * Envía un correo de restablecimiento de contraseña
 */
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('❌ [AUTH] Error al enviar reset:', error);
    throw error;
  }
};

export async function signInWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (!idToken) {
        throw { code: 'auth/generic-error', message: 'No se pudo obtener el token de autenticación' };
      }
      return {
        idToken,
        user: {
          uid: result.user?.uid || '',
          displayName: result.user?.displayName || null,
          email: result.user?.email || null,
        },
      };
    } catch (error) {
      throw mapNativeAuthError(error);
    }
  }

  // Web fallback (localhost / browser dev)
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

/**
 * Maps native Capacitor Firebase Auth error codes to Firebase Web SDK equivalents
 * so AuthPage.jsx error handling works unchanged on both platforms.
 */
function mapNativeAuthError(error) {
  const code = error?.code || '';
  const message = error?.message || '';

  // Already in Firebase web format (e.g. auth/invalid-credential) → pass through
  if (code.startsWith('auth/')) {
    return error;
  }

  // User cancelled the native sign-in flow → silent (caught by auth/popup-closed-by-user check)
  if (code.includes('cancel') || code.includes('CANCEL') || message.toLowerCase().includes('cancel')) {
    return { code: 'auth/popup-closed-by-user', message: '' };
  }

  // Network-related errors
  if (code.includes('NETWORK') || message.toLowerCase().includes('network')) {
    return { code: 'auth/network-request-failed', message: 'No se pudo conectar con la API' };
  }

  // Design-specified codes for backward compat
  if (code === 'ERROR_GOOGLE_SIGNIN_FAILED') {
    return { code: 'auth/generic-error', message: 'Error al iniciar sesión con Google' };
  }

  // Fallback: generic error with original message
  return { code: 'auth/generic-error', message: message || 'Error al iniciar sesión con Google' };
}

export { auth };
