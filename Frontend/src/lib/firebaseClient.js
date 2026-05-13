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
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  initializeAuth
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCK2gjZJFXG-24OSylfns5uckDjK5LuDuM', // Actualizada desde google-services.json
  authDomain: 'tempos-project-f1e77.firebaseapp.com',
  projectId: 'tempos-project-f1e77',
  storageBucket: 'tempos-project-f1e77.firebasestorage.app',
  messagingSenderId: '898534343258',
  appId: '1:898534343258:web:26e51cefcf0330aa2a4e63',
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
      const nativePromise = FirebaseAuthentication.signInWithGoogle({
        webClientId: '898534343258-ebk5amiu99gqbm900q8p5duiqg186mfh.apps.googleusercontent.com'
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
    return null;
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
