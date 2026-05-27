const SESSION_STORAGE_KEY = 'tempos.session';

function getSessionStorage() {
  try {
    const remember = localStorage.getItem('tempos.remember');
    return remember === 'true' ? localStorage : sessionStorage;
  } catch {
    return sessionStorage;
  }
}

export function getClientSession() {
  try {
    const storage = getSessionStorage();
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setClientSession(session) {
  const storage = getSessionStorage();
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearClientSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getDeviceId() {
  // Prioridad: Hardware ID nativo > UUID generado
  const HARDWARE_KEY = 'tempos.hardware_device_id';
  const DEVICE_ID_KEY = 'tempos.device_id';

  // Si hay un ID de hardware (vinculado por nativeServices), usarlo
  const hardwareId = localStorage.getItem(HARDWARE_KEY);
  if (hardwareId) return hardwareId;

  // Fallback: UUID generado (web)
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = crypto.randomUUID?.() || `dev_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}
