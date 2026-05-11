import { initializeApp, getApps } from 'firebase/app';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  signOut,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  initializeAuth
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Aseguramos que el authDomain sea exactamente el de firebaseapp.com para evitar bloqueos de frames
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Inicialización ultra-robusta
const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});

export async function signInAndGetIdToken(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user.getIdToken();
}

export const signInWithGoogleAndGetIdToken = async (mode = 'redirect') => {
  // ESTRATEGIA NATIVA (Android/iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('⚡ [AUTH] Usando flujo NATIVO de Google para producción');
      const result = await FirebaseAuthentication.signInWithGoogle();
      return result.user.idToken;
    } catch (error) {
      console.error('❌ [AUTH] Error en login NATIVO:', error);
      // Fallback a web si el plugin falla (raro, pero preventivo)
    }
  }

  // ESTRATEGIA WEB (Fallback / Dev)
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ 
    prompt: 'select_account'
  });

  try {
    console.log(`⚡ [AUTH] Iniciando Google Web (${mode})`);
    if (mode === 'redirect') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    const result = await signInWithPopup(auth, provider);
    return await result.user.getIdToken();
  } catch (error) {
    console.error('❌ [AUTH] Error detallado Web:', error);
    return null;
  }
};

export const handleGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return await result.user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('❌ [AUTH] Error en retorno:', error);
    return null;
  }
};

export async function logout() {
  await signOut(auth);
}

export { auth };
