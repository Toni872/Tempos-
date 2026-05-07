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
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ 
    prompt: 'select_account',
    auth_type: 'reauthenticate' 
  });

  try {
    console.log(`⚡ [AUTH] Iniciando proceso de Google (${mode})...`);

    if (mode === 'redirect') {
      await signInWithRedirect(auth, provider);
      return null;
    }

    const result = await signInWithPopup(auth, provider);
    console.log('✅ [AUTH] Login con popup exitoso!');
    return await result.user.getIdToken();
  } catch (error) {
    console.error('❌ [AUTH] Error en login Google:', error);
    
    // Si falla cualquier cosa, el último recurso siempre es redirect
    if (mode !== 'redirect') {
      console.warn('⚠️ [AUTH] Falló popup, reintentando con redirect...');
      await signInWithRedirect(auth, provider);
    }
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
