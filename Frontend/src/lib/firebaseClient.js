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
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
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
const auth = getAuth(app); // Simplificado al máximo para evitar fallos en el arranque

export async function signInAndGetIdToken(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user.getIdToken();
}

export async function signUpAndGetIdToken(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user.getIdToken();
}

export const signInWithGoogleAndGetIdToken = async (onStatusUpdate) => {
  // VOLVEMOS A NATIVO (Es lo único que no pierde la memoria en móvil)
  const forceWeb = false; 
  
  if (Capacitor.isNativePlatform() && !forceWeb) {
    try {
      if (onStatusUpdate) onStatusUpdate('Despertando a Google...');
      
      // Intentamos el login nativo con un tiempo de espera interno
      const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || import.meta.env.VITE_FIREBASE_WEB_CLIENT_ID || '';
      if (!webClientId) {
        console.warn('⚠️ VITE_GOOGLE_WEB_CLIENT_ID no configurado. Revisa .env');
      }

      const nativePromise = FirebaseAuthentication.signInWithGoogle({
        webClientId: webClientId
      });

      const result = await nativePromise;
      
      if (onStatusUpdate) onStatusUpdate('Token recibido. Finalizando...');
      const tokenResult = await FirebaseAuthentication.getIdToken();
      return tokenResult.token;
      
    } catch (error) {
      console.error('❌ [AUTH] Error Nativo:', error);
      if (onStatusUpdate) onStatusUpdate('Modo nativo falló. Probando modo web...');
      // Si falla lo nativo, dejamos que siga al bloque WEB de abajo
    }
  }

  // ESTRATEGIA WEB (Navegador Desktop o Fallback forzado)
  if (onStatusUpdate) onStatusUpdate('Abriendo Google en navegador...');
  console.log('⚡ [AUTH] Iniciando Google REDIRECT (Fail-safe)');
  
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    // En móvil, la redirección es mucho más fiable que el popup
    if (Capacitor.isNativePlatform()) {
      await signInWithRedirect(auth, provider);
      // El código se detiene aquí porque la app se redirige. 
      // Al volver, el token se recupera en el observador de estado.
      return null; 
    } else {
      const result = await signInWithPopup(auth, provider);
      return await result.user.getIdToken();
    }
  } catch (error) {
    console.error('❌ [AUTH] Error Google Redirect/Popup:', error);
    if (onStatusUpdate) onStatusUpdate('Error: ' + (error.message || 'Desconocido'));
    throw error;
  }
};

// Función para recuperar el resultado después de una redirección (útil para móvil)
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return await result.user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Error recuperando resultado de redirección:', error);
    return null;
  }
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

export { auth };
