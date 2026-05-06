/**
 * Logger Senior para Tempos.
 * Centraliza el monitoreo de errores y eventos importantes.
 */
const IS_DEV = process.env.NODE_ENV === 'development';

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
    try {
      fetch('/api/v1/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      });
    } catch (e) {
      // Si falla el reporte, no queremos que la app muera, solo lo ignoramos
    }
  },

  audit: (action, userId, success = true) => {
    // Registro especial para acciones críticas del usuario
    logger.info(`AUDIT: ${action} | User: ${userId} | Success: ${success}`);
  }
};

export default logger;
