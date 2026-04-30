// En desarrollo, usamos rutas relativas para que el proxy de Vite las reenvíe al backend.
// En producción, VITE_API_URL apuntará al dominio real del backend.
const DEFAULT_LOCAL_API = '';
const SESSION_STORAGE_KEY = 'tempos.session';

function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }

  return DEFAULT_LOCAL_API;
}

function buildUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = getApiBaseUrl();
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function toQueryString(params = {}) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const text = String(value).trim();
    if (!text) return;
    qs.set(key, text);
  });

  return qs.toString();
}

async function request(path, options = {}) {
	const { token, headers, ...rest } = options;

	const response = await fetch(buildUrl(path), {
		...rest,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(headers || {}),
		},
	});

	let payload = null;
	try {
		payload = await response.json();
	} catch {
		payload = null;
	}

	if (!response.ok) {
		const message = payload?.error || payload?.message || `Error HTTP ${response.status}`;
		const error = new Error(message);
		error.status = response.status;
		throw error;
	}

	return payload;
}

async function requestBlob(path, options = {}) {
	const { token, headers, ...rest } = options;
	const res = await fetch(buildUrl(path), {
		...rest,
		headers: {
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
  return request('/api/v1/auth/register', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

export async function getMe(token) {
  return request('/api/v1/auth/me', {
    method: 'GET',
    token,
  });
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

// Employees
export async function listEmployees(token) {
  return request('/api/v1/employees', { method: 'GET', token });
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

// Work Centers (Centros de Trabajo)
export async function listWorkCenters(token) {
  return request('/api/v1/work-centers', { method: 'GET', token });
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

// Schedules & Shifts
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

export async function listDocuments(token, params = {}) {
  const qs = toQueryString(params);
  const path = `/api/v1/documents${qs ? `?${qs}` : ''}`;
  return request(path, { method: 'GET', token });
}

// Absences
export async function requestAbsence(token, data) {
  return request('/api/v1/absences', { method: 'POST', token, body: JSON.stringify(data) });
}

export async function listAbsences(token) {
  return request('/api/v1/absences', { method: 'GET', token });
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

export async function breakEnd(token, payload = {}) {
  const deviceId = getDeviceId();
  const body = { ...payload, deviceId };
  return request('/api/v1/fichas/break-end', { method: 'POST', token, body: JSON.stringify(body) });
}

export async function getActiveFicha(token) {
  return request('/api/v1/fichas/active', { method: 'GET', token });
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
