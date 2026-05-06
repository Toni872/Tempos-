import { initializeApp, getApps } from 'firebase/app';
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
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Inicialización ultra-explícita para evitar bloqueos de Chrome
const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});

export async function signInAndGetIdToken(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user.getIdToken();
}

export const signInWithGoogleAndGetIdToken = async (mode = 'popup') => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ 
    prompt: 'select_account',
    // Forzamos que no intente usar sesiones previas que puedan estar bloqueadas
    auth_type: 'reauthenticate' 
  });

  try {
    console.log('⚡ [AUTH] Iniciando proceso de Google...');

    if (mode === 'redirect') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    const result = await signInWithPopup(auth, provider);
    console.log('✅ [AUTH] Login exitoso!');
    return await result.user.getIdToken();
  } catch (error) {
    console.error('❌ [AUTH] Error detallado:', {
      code: error.code,
      message: error.message,
      customData: error.customData
    });
    
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn('⚠️ [AUTH] El popup se cerró solo o fue bloqueado. Saltando a Redirect...');
    }
    
    await signInWithRedirect(auth, provider);
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
