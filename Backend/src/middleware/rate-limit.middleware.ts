import rateLimit from 'express-rate-limit';

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const defaultWindowMs = process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000;
const defaultMax = process.env.NODE_ENV === 'production' ? 25 : 100;

const authWindowMs = parseIntEnv('AUTH_RATE_LIMIT_WINDOW_MS', defaultWindowMs);
const authMax = parseIntEnv('AUTH_RATE_LIMIT_MAX', defaultMax);

export const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  limit: authMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes de autenticacion. Intenta de nuevo en unos minutos.',
  },
  skip: (_req, _res) => process.env.DISABLE_AUTH_RATE_LIMIT === 'true',
});
