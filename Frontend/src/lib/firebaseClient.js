// Carga Firebase de forma dinámica. Si la dependencia `firebase` no está instalada,
// mostramos un error manejable en tiempo de ejecución en lugar de romper la carga del bundle.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let _initialized = false;
let _auth = null;

async function _ensureFirebase() {
  if (_initialized) return;
  _initialized = true;
  try {
    const firebase = await import('firebase/app');
    const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
    // initializeApp may throw if config is incomplete — surface a clear error
    try {
      firebase.initializeApp(firebaseConfig);
    } catch (initErr) {
      // If already initialized by another part, ignore
      if (!/already exists/.test(String(initErr))) {
        throw initErr;
      }
    }
    _auth = getAuth();
    // Guardamos la función de signin en el objeto para exportar en runtime
    _ensureFirebase.signIn = async (email, password) => {
      const userCredential = await signInWithEmailAndPassword(_auth, email, password);
      if (!userCredential) throw new Error('No se pudo autenticar');
      return userCredential.user.getIdToken();
    };
  } catch (err) {
    // Dependencia ausente o fallo en init — proporcionar un error claro
    const msg = (err && err.code === 'ERR_MODULE_NOT_FOUND') || /Cannot find module/.test(String(err))
      ? 'Módulo "firebase" no instalado. Instala "firebase" en Frontend con `npm install firebase` para habilitar autenticación.'
      : `Error inicializando Firebase: ${String(err)}`;
    throw new Error(msg);
  }
}

export async function signInAndGetIdToken(email, password) {
  await _ensureFirebase();
  if (typeof _ensureFirebase.signIn !== 'function') {
    throw new Error('Firebase no está disponible');
  }
  return _ensureFirebase.signIn(email, password);
}

export async function signInWithGoogleAndGetIdToken() {
  await _ensureFirebase();
  if (!_auth) {
    throw new Error('Firebase no está disponible');
  }

  const { GoogleAuthProvider, signInWithPopup, browserPopupRedirectResolver } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  
  try {
    console.log('🚀 [AUTH] Iniciando flujo Google con Popup...');
    const userCredential = await signInWithPopup(_auth, provider, browserPopupRedirectResolver);
    
    if (!userCredential) {
      throw new Error('No se pudo autenticar con Google (sin credenciales)');
    }
    
    console.log('✅ [AUTH] Autenticación exitosa');
    return userCredential.user.getIdToken();
  } catch (err) {
    console.error('❌ [AUTH] Error en Google SignIn:', err);
    
    // Mapeo de errores específicos para ayudar al usuario
    if (err.code === 'auth/popup-blocked') {
      throw new Error('El navegador ha bloqueado la ventana emergente. Por favor, permite los popups para este sitio.');
    }
    if (err.code === 'auth/internal-error') {
      throw new Error('Error interno de Firebase. Comprueba que el dominio localhost:5173 esté autorizado en la consola de Firebase.');
    }
    if (err.code === 'auth/network-request-failed') {
      throw new Error('Error de red. Comprueba tu conexión o si Chrome está bloqueando las peticiones a Google.');
    }
    if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
      return null; // El usuario cerró la ventana, no es un error crítico
    }

    throw err;
  }
}

export function initFirebase() {
  // Mantener por compatibilidad: intenta inicializar pero no lanza si falla, para permitir modo local
  return _ensureFirebase().then(() => ({ auth: _auth })).catch(() => null);
}
