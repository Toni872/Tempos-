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

export const signInWithGoogleAndGetIdToken = async (mode = 'popup') => {
  // ESTRATEGIA NATIVA (Android/iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('⚡ [AUTH] Iniciando Google NATIVO...');
      
      // La librería capawesome usa CredentialManager en Android. No necesita parámetros webClientId aquí.
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      // Si el login es exitoso, la librería sincroniza automáticamente con Firebase.
      // Obtenemos el token directamente de la sesión autenticada.
      const tokenResult = await FirebaseAuthentication.getIdToken();
      return tokenResult.token;
      
    } catch (error) {
      console.error('❌ [AUTH] Error Nativo CRÍTICO:', error);
      
      // Mostramos el error exacto para saber qué falta en la consola de Google.
      alert(`ERROR NATIVO DE GOOGLE:\n${error.message || JSON.stringify(error)}`);
      return null;
    }
  }

  // ESTRATEGIA WEB (Navegador Desktop)
  console.log('⚡ [AUTH] Iniciando Google WEB');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    return await result.user.getIdToken();
  } catch (error) {
    console.error('❌ [AUTH] Error Web:', error);
    alert('Error al entrar con Google: ' + error.message);
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
