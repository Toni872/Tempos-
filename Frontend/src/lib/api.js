import { z } from 'zod';
import { apiRateLimiter, authRateLimiter, generateCSRFToken } from './security';
import logger from './logger';
import { 
  UserSchema, 
  FichaSchema, 
  EmployeeSchema, 
  WorkCenterSchema, 
  DocumentSchema, 
  AbsenceSchema 
} from './schemas';

const DEFAULT_LOCAL_API = 'http://localhost:8081';
const SESSION_STORAGE_KEY = 'tempos.session';
const OFFLINE_QUEUE_KEY = 'tempos.offline_queue';

let currentCsrfToken = generateCSRFToken();

function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  return DEFAULT_LOCAL_API;
}

function buildUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = getApiBaseUrl();
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function toQueryString(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') qs.set(key, String(value).trim());
  });
  return qs.toString();
}

/**
 * Clase de error personalizada para respuestas de la API
 */
export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const getOfflineQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch { return []; }
};

const addToOfflineQueue = (path, options) => {
  const queue = getOfflineQueue();
  if (path.includes('/fichas/clock') || path.includes('/fichas/break')) {
    queue.push({
      id: crypto.randomUUID(),
      path,
      options: { ...options, body: options.body ? JSON.parse(options.body) : null },
      timestamp: new Date().toISOString(),
      retryCount: 0
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return true;
  }
  return false;
};

export async function syncOfflineQueue(token) {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const remaining = [];
  for (const item of queue) {
    try {
      await request(item.path, {
        ...item.options,
        token,
        body: JSON.stringify({ ...item.options.body, offlineTimestamp: item.timestamp, isOfflineSync: true })
      });
    } catch (err) {
      if (item.retryCount < 5) remaining.push({ ...item, retryCount: item.retryCount + 1 });
    }
  }
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const session = getClientSession();
    if (session?.token) syncOfflineQueue(session.token);
  });
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function request(path, options = {}, retryCount = 0) {
  if (!apiRateLimiter.canMakeRequest()) throw new Error("Tasa de peticiones excedida.");

  const { token, headers, ...rest } = options;
  try {
    const response = await fetch(buildUrl(path), {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': currentCsrfToken,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });

    let payload = null;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) payload = await response.json();

    if (!response.ok) {
      const errorData = payload?.error || {};
      throw new ApiError(errorData.message || `Error ${response.status}`, response.status, errorData.code);
    }
    return payload;
  } catch (error) {
    if (!navigator.onLine || error.message === 'Failed to fetch') {
      if (addToOfflineQueue(path, options)) return { offline: true };
      if (retryCount < 3) {
        await wait(Math.pow(2, retryCount) * 1000);
        return request(path, options, retryCount + 1);
      }
    }
    throw error;
  }
}

async function requestBlob(path, options = {}) {
	if (!apiRateLimiter.canMakeRequest()) {
		throw new Error("Tasa de peticiones excedida.");
	}
	const { token, headers, ...rest } = options;
	const res = await fetch(buildUrl(path), {
		...rest,
		headers: {
			'X-CSRF-Token': currentCsrfToken,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(headers || {}),
		},
	});

	if (!res.ok) {
		let payload = null;
		try { payload = await res.json(); } catch {};
		const message = payload?.error || payload?.message || `Error HTTP ${res.status}`;
		const error = new Error(message);
		error.status = res.status;
		throw error;
	}

	const blob = await res.blob();
	return blob;
}

export function getClientSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setClientSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearClientSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getDeviceId() {
  const DEVICE_ID_KEY = 'tempos.device_id';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = crypto.randomUUID?.() || `dev_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

export async function registerMe(token, data = {}) {
  if (!authRateLimiter.canMakeRequest()) throw new Error("Tasa de auth excedida. Por favor, espera.");
  return request('/api/v1/auth/register', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}


export async function getMe(token) {
  try {
    const res = await request('/api/v1/auth/me', { method: 'GET', token });
    return UserSchema.parse(res?.data || res);
  } catch (err) {
    logger.error('Error in getMe (Profile)', err);
    throw err;
  }
}

export async function getActiveFicha(token) {
  try {
    const res = await request('/api/v1/fichas/active', { method: 'GET', token });
    const data = res?.data ?? res?.ficha ?? res;
    if (!data || !data.id) return null;
    return FichaSchema.parse(data);
  } catch (err) {
    logger.error('Error in getActiveFicha', err);
    throw err;
  }
}



export async function pingStatus(token) {
  return request('/status', {
    method: 'GET',
    token,
  });
}

export async function submitContact({ name, email, phone, message }) {
  return request('/api/v1/contact', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, message }),
  });
}

export async function getDailyStats(token, startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) {
    params.set('startDate', startDate);
  }
  if (endDate) {
    params.set('endDate', endDate);
  }

  const query = params.toString();
  const path = `/api/v1/fichas/stats/daily${query ? `?${query}` : ''}`;

  return request(path, {
    method: 'GET',
    token,
  });
}


export async function listEmployees(token) {
  try {
    const res = await request('/api/v1/employees', { method: 'GET', token });
    const data = res?.data || res;
    return z.array(EmployeeSchema).parse(Array.isArray(data) ? data : []);
  } catch (err) {
    logger.error('Error in listEmployees', err);
    return [];
  }
}

export async function listWorkCenters(token) {
  try {
    const res = await request('/api/v1/work-centers', { method: 'GET', token });
    const data = res?.data || res;
    return z.array(WorkCenterSchema).parse(Array.isArray(data) ? data : []);
  } catch (err) {
    logger.error('Error in listWorkCenters', err);
    return [];
  }
}

export async function listDocuments(token, params = {}) {
  try {
    const qs = toQueryString(params);
    const path = `/api/v1/documents${qs ? `?${qs}` : ''}`;
    const res = await request(path, { method: 'GET', token });
    const data = res?.data || res;
    return z.array(DocumentSchema).parse(Array.isArray(data) ? data : []);
  } catch (err) {
    logger.error('Error in listDocuments', err);
    return [];
  }
}

export async function listAbsences(token) {
  try {
    const res = await request('/api/v1/absences', { method: 'GET', token });
    const data = res?.data || res;
    return z.array(AbsenceSchema).parse(Array.isArray(data) ? data : []);
  } catch (err) {
    logger.error('Error in listAbsences', err);
    return [];
  }
}

export async function createEmployee(token, data) {
  return request('/api/v1/employees', { method: 'POST', token, body: JSON.stringify(data) });
}

export async function updateEmployee(token, id, data) {
  return request(`/api/v1/employees/${id}`, { method: 'PUT', token, body: JSON.stringify(data) });
}

export async function deleteEmployee(token, id) {
  return request(`/api/v1/employees/${id}`, { method: 'DELETE', token });
}

export async function createWorkCenter(token, data) {
  return request('/api/v1/work-centers', { method: 'POST', token, body: JSON.stringify(data) });
}

export async function updateWorkCenter(token, id, data) {
  return request(`/api/v1/work-centers/${id}`, { method: 'PUT', token, body: JSON.stringify(data) });
}

export async function deleteWorkCenter(token, id) {
  return request(`/api/v1/work-centers/${id}`, { method: 'DELETE', token });
}

export async function updateProfile(token, data) {
  return request('/api/v1/auth/profile', { 
    method: 'PUT', 
    token,
    body: JSON.stringify(data)
  });
}

export async function listSchedules(token) {
  return request('/api/v1/schedules', { method: 'GET', token });
}

export async function createSchedule(token, data) {
  return request('/api/v1/schedules', { method: 'POST', token, body: JSON.stringify(data) });
}

export async function listShiftAssignments(token) {
  return request('/api/v1/schedules/assignments', { method: 'GET', token });
}

export async function assignShift(token, data) {
  return request('/api/v1/schedules/assign', { method: 'POST', token, body: JSON.stringify(data) });
}

// Documents
export async function uploadDocument(token, formData) {
  const path = '/api/v1/documents';
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let payload = null;
    try { payload = await response.json(); } catch {}
    const message = payload?.error || payload?.message || `Error HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function downloadDocument(token, id) {
  return requestBlob(`/api/v1/documents/${id}/download`, { method: 'GET', token });
}

export async function signDocument(token, id, data = {}) {
  return request(`/api/v1/documents/${id}/sign`, { 
    method: 'POST', 
    token,
    body: JSON.stringify(data)
  });
}

export async function acceptTerms(token) {
  return request('/api/v1/auth/accept-terms', { method: 'POST', token });
}

// Absences
export async function requestAbsence(token, data) {
  return request('/api/v1/absences', { method: 'POST', token, body: JSON.stringify(data) });
}

export async function approveAbsence(token, id) {
  return request(`/api/v1/absences/${id}/approve`, { method: 'POST', token });
}

export async function rejectAbsence(token, id) {
  return request(`/api/v1/absences/${id}/reject`, { method: 'POST', token });
}

export async function listFichas(token, params = {}) {
  const qs = toQueryString(params);
  const path = `/api/v1/fichas${qs ? `?${qs}` : ''}`;
  return request(path, { method: 'GET', token });
}

export async function getDashboardStats(token) {
  return request('/api/v1/reports/dashboard-stats', { method: 'GET', token });
}

export async function getReportSummary(token) {
  return request('/api/v1/reports/summary', { method: 'GET', token });
}

export async function listAuditLog(token, params = {}) {
  const qs = toQueryString(params);
  const path = `/api/v1/reports/audit-log${qs ? `?${qs}` : ''}`;
  return request(path, { method: 'GET', token });
}

export async function getAiInsights(token) {
  return request('/api/v1/reports/ai-predictive-analysis', { method: 'GET', token });
}

export async function exportAuditLog(token, params = {}) {
  const qs = toQueryString(params);
  const path = `/api/v1/reports/audit-log/export${qs ? `?${qs}` : ''}`;
  return requestBlob(path, { method: 'GET', token });
}

export async function closeFichaPeriod(token, payload) {
  return request('/api/v1/fichas/close-period', { method: 'POST', token, body: JSON.stringify(payload) });
}

// Reports & export
export async function exportReport(token, params = {}) {
  const qs = toQueryString(params);
  const path = `/api/v1/reports/export${qs ? `?${qs}` : ''}`;
  return requestBlob(path, { method: 'GET', token });
}

export async function exportAuditPDF(token) {
  return requestBlob('/api/v1/reports/audit-pdf', { method: 'GET', token });
}

export async function exportInspectionPDF(token) {
  return requestBlob('/api/v1/reports/inspection-pdf', { method: 'GET', token });
}

// Clock in/out
export async function clockIn(token, payload = {}) {
  const deviceId = getDeviceId();
  const body = { ...payload, deviceId };
  return request('/api/v1/fichas/clockin', { method: 'POST', token, body: JSON.stringify(body) });
}

export async function clockOut(token, payload = {}) {
  const deviceId = getDeviceId();
  const body = { ...payload, deviceId };
  return request('/api/v1/fichas/clockout', { method: 'POST', token, body: JSON.stringify(body) });
}

export async function breakStart(token, payload = {}) {
  const deviceId = getDeviceId();
  const body = { ...payload, deviceId };
  return request('/api/v1/fichas/break-start', { method: 'POST', token, body: JSON.stringify(body) });
}

export async function breakStartInternal(token, payload = {}) {
  return request('/api/v1/fichas/break-start', { method: 'POST', token, body: JSON.stringify(payload) });
}

export async function breakEnd(token, payload = {}) {
  const deviceId = getDeviceId();
  const body = { ...payload, deviceId };
  return request('/api/v1/fichas/break-end', { method: 'POST', token, body: JSON.stringify(body) });
}


export async function bootstrapLocalSession({ isAdmin = false } = {}) {
  const roleToken = isAdmin ? 'test-admin' : 'test-employee';
  const fallbackToken = 'test';

  const ensureLocalUser = async (token) => {
    try {
      return await getMe(token);
    } catch {
      try {
        await registerMe(token);
      } catch {
        // Si ya existe el usuario o hay carrera, reintentamos lectura.
      }
      return getMe(token);
    }
  };

  let token = roleToken;
  let profile;

  try {
    profile = await ensureLocalUser(roleToken);
  } catch {
    // Compatibilidad hacia atrás con sesiones antiguas que usaban token "test".
    token = fallbackToken;
    profile = await ensureLocalUser(fallbackToken);
  }

  const session = {
    token,
    isAdmin,
    localMode: true,
    profile,
  };

  setClientSession(session);
  return session;
}

// WebAuthn
export async function getWebAuthnRegistrationOptions(token) {
  return request('/api/v1/webauthn/generate-registration-options', { method: 'GET', token });
}

export async function verifyWebAuthnRegistration(token, body) {
  return request('/api/v1/webauthn/verify-registration', { 
    method: 'POST', 
    token, 
    body: JSON.stringify(body) 
  });
}

export async function getWebAuthnAuthenticationOptions(email) {
  const path = `/api/v1/webauthn/generate-authentication-options${email ? `?email=${encodeURIComponent(email)}` : ''}`;
  return request(path, { method: 'GET' });
}

export async function verifyWebAuthnAuthentication(email, body) {
  return request('/api/v1/webauthn/verify-authentication', { 
    method: 'POST', 
    body: JSON.stringify({ email, body }) 
  });
}

// Push Notifications
export async function subscribePush(subscription) {
  return request('/api/v1/push/subscribe', { 
    method: 'POST', 
    body: JSON.stringify(subscription) 
  });
}

export async function unsubscribePush(endpoint) {
  return request('/api/v1/push/unsubscribe', { 
    method: 'POST', 
    body: JSON.stringify({ endpoint }) 
  });
}

export async function sendTestPush() {
  return request('/api/v1/push/send-test', { method: 'POST' });
}

const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body: typeof body === 'string' ? body : JSON.stringify(body) }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default api;
