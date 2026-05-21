import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import { createServer } from "node:http";
import { createAuthRateLimiter } from "../middleware/rate-limit.middleware.js";

function createTestApp(
  limit: number,
  skip?: (req: unknown, res: unknown) => boolean,
) {
  const app = express();

  app.use(
    "/api/v1/auth",
    createAuthRateLimiter({
      windowMs: 60_000,
      limit,
      skip,
    }),
  );

  app.get("/api/v1/auth/ping", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  return app;
}

async function withTestServer<T>(
  app: ReturnType<typeof express>,
  run: (baseUrl: string) => Promise<T>,
) {
  const server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("No se pudo obtener puerto del servidor de test");
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

test("auth rate limiter bloquea cuando supera el limite", async () => {
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
      "Demasiadas solicitudes de autenticacion. Intenta de nuevo en unos minutos.",
    );
  });
});

test("auth rate limiter permite peticiones cuando skip devuelve true", async () => {
  const app = createTestApp(1, () => true);

  await withTestServer(app, async (baseUrl) => {
    const first = await fetch(`${baseUrl}/api/v1/auth/ping`);
    const second = await fetch(`${baseUrl}/api/v1/auth/ping`);

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
  });
});

// ─── registerRateLimiter ───────────────────────────────────────────────────

import { createRegisterRateLimiter } from "../middleware/rate-limit.middleware.js";

function createRegisterApp() {
  const app = express();

  // Create isolated instance with no skip for testing
  const testLimiter = createRegisterRateLimiter({ skip: () => false });

  app.use("/api/v1/auth/register", testLimiter);

  app.post("/api/v1/auth/register", (_req, res) => {
    res.status(201).json({ ok: true });
  });

  // Different auth endpoint — should NOT be affected by register limiter
  app.get("/api/v1/auth/me", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  return app;
}

test("registerRateLimiter: 10ma request pasa, 11va retorna 429", async () => {
  const app = createRegisterApp();

  await withTestServer(app, async (baseUrl) => {
    const url = `${baseUrl}/api/v1/auth/register`;

    // 10 requests — todas pasan
    for (let i = 0; i < 10; i++) {
      const res = await fetch(url, { method: "POST" });
      assert.equal(res.status, 201, `Request ${i + 1} should pass`);
    }

    // 11va — bloqueada
    const blocked = await fetch(url, { method: "POST" });
    assert.equal(blocked.status, 429);

    const payload = (await blocked.json()) as { error?: string };
    assert.ok(payload.error?.includes("Demasiados intentos de registro"));
  });
});

test("registerRateLimiter: otros endpoints auth no se ven afectados", async () => {
  const app = createRegisterApp();

  await withTestServer(app, async (baseUrl) => {
    const registerUrl = `${baseUrl}/api/v1/auth/register`;

    // Consumir el rate limit de register
    for (let i = 0; i < 10; i++) {
      const res = await fetch(registerUrl, { method: "POST" });
      assert.equal(res.status, 201);
    }

    // register endpoint ahora bloquea
    const blocked = await fetch(registerUrl, { method: "POST" });
    assert.equal(blocked.status, 429);

    // /auth/me no deberia verse afectado
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.equal(meRes.status, 200);
  });
});
