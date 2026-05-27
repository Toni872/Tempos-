import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

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
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

export { auth };
