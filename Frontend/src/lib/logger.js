/**
 * Logger Senior para Tempos.
 * Centraliza el monitoreo de errores y eventos importantes.
 * Incluye rate-limiting y deduplicación para evitar avalanchas de reportes.
 */
const IS_DEV = process.env.NODE_ENV === 'development';

// Rate-limiting: máximo 1 reporte al backend cada 10 segundos
let lastReportTime = 0;
const REPORT_COOLDOWN_MS = 10_000;

// Deduplicación: no reportar el mismo mensaje más de una vez por minuto
const recentMessages = new Map();
const DEDUP_WINDOW_MS = 60_000;

function shouldReport(message) {
  const now = Date.now();

  // Cooldown global
  if (now - lastReportTime < REPORT_COOLDOWN_MS) return false;

  // Dedup por mensaje
  const lastSeen = recentMessages.get(message);
  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) return false;

  // Limpiar entradas viejas
  for (const [key, ts] of recentMessages) {
    if (now - ts > DEDUP_WINDOW_MS) recentMessages.delete(key);
  }

  lastReportTime = now;
  recentMessages.set(message, now);
  return true;
}

const logger = {
  info: (message, context = {}) => {
    if (IS_DEV) {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context);
    }
  },

  warn: (message, context = {}) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context);
  },

  error: async (message, error = null, context = {}) => {
    const errorData = {
      message,
      errorMessage: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context
    };

    console.error(`[ERROR] [${errorData.timestamp}] ${message}`, errorData);
    
    // REPORTE SENIOR: Enviar al backend para que este lo mande a Slack
    // Con rate-limiting y dedup para evitar avalanchas cuando el backend está caído
    if (shouldReport(message)) {
      try {
        fetch('/api/v1/logs/error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        }).catch(() => { /* silenciar si el backend no responde */ });
      } catch {
        // Si falla el reporte, no queremos que la app muera
      }
    }
  },

  audit: (action, userId, success = true) => {
    // Registro especial para acciones críticas del usuario
    logger.info(`AUDIT: ${action} | User: ${userId} | Success: ${success}`);
  }
};

export default logger;
