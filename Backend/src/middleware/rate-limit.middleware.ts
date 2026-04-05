import rateLimit, { type Options } from 'express-rate-limit';

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function createAuthRateLimiter(overrides: Partial<Options> = {}) {
  const defaultWindowMs = process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000;
  const defaultMax = process.env.NODE_ENV === 'production' ? 25 : 100;

  const authWindowMs = parseIntEnv('AUTH_RATE_LIMIT_WINDOW_MS', defaultWindowMs);
  const authMax = parseIntEnv('AUTH_RATE_LIMIT_MAX', defaultMax);

  return rateLimit({
    windowMs: authWindowMs,
    limit: authMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: 'Demasiadas solicitudes de autenticacion. Intenta de nuevo en unos minutos.',
    },
    skip: () => process.env.DISABLE_AUTH_RATE_LIMIT === 'true',
    ...overrides,
  });
}

export const authRateLimiter = createAuthRateLimiter();
