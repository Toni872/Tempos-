import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createServer } from 'node:http';
import { createAuthRateLimiter } from '../middleware/rate-limit.middleware.js';

function createTestApp(limit: number, skip?: (req: unknown, res: unknown) => boolean) {
  const app = express();

  app.use(
    '/api/v1/auth',
    createAuthRateLimiter({
      windowMs: 60_000,
      limit,
      skip,
    }),
  );

  app.get('/api/v1/auth/ping', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  return app;
}

async function withTestServer<T>(app: ReturnType<typeof express>, run: (baseUrl: string) => Promise<T>) {
  const server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('No se pudo obtener puerto del servidor de test');
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

test('auth rate limiter bloquea cuando supera el limite', async () => {
  const app = createTestApp(2);

  await withTestServer(app, async (baseUrl) => {
    const first = await fetch(`${baseUrl}/api/v1/auth/ping`);
    const second = await fetch(`${baseUrl}/api/v1/auth/ping`);
    const third = await fetch(`${baseUrl}/api/v1/auth/ping`);

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(third.status, 429);

    const payload = (await third.json()) as { error?: string };
    assert.equal(
      payload.error,
      'Demasiadas solicitudes de autenticacion. Intenta de nuevo en unos minutos.',
    );
  });
});

test('auth rate limiter permite peticiones cuando skip devuelve true', async () => {
  const app = createTestApp(1, () => true);

  await withTestServer(app, async (baseUrl) => {
    const first = await fetch(`${baseUrl}/api/v1/auth/ping`);
    const second = await fetch(`${baseUrl}/api/v1/auth/ping`);

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
  });
});
