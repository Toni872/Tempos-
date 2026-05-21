import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";

import { requireEmailVerified } from "../middleware/auth.middleware.js";
import { buildValidationError, registerSchema } from "../utils/validation.js";
import { EmailService } from "../services/EmailService.js";
import { AppDataSource } from "../database.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// ─── Domain validation logic (mirrors auth.controller.ts) ──────────────────

function validateDomain(
  role: string,
  email: string | undefined,
  companyDomain: string,
  uid: string,
  env: string = "production",
): "active" | "pending" {
  const DEV_BYPASS_UIDS = ["dev-admin-uid", "dev-employee-uid"];
  const skipDomainCheck =
    env === "development" ||
    uid.startsWith("temp_") ||
    DEV_BYPASS_UIDS.includes(uid);

  if (role !== "admin" || skipDomainCheck) return "active";

  const emailDomain = email?.split("@")[1]?.toLowerCase();
  if (!companyDomain) return "pending";
  if (emailDomain && emailDomain !== companyDomain.toLowerCase()) return "pending";
  return "active";
}

test("matching domain returns active", () => {
  assert.equal(
    validateDomain("admin", "user@acme.com", "acme.com", "uid-123"),
    "active",
  );
});

test("non-matching domain returns pending", () => {
  assert.equal(
    validateDomain("admin", "user@gmail.com", "acme.com", "uid-123"),
    "pending",
  );
});

test("missing companyDomain returns pending for admin", () => {
  assert.equal(
    validateDomain("admin", "user@gmail.com", "", "uid-123"),
    "pending",
  );
});

test("employee role skips domain validation", () => {
  assert.equal(
    validateDomain("employee", "user@gmail.com", "acme.com", "uid-123"),
    "active",
  );
});

test("temp_ UID skips domain validation regardless of domain mismatch", () => {
  assert.equal(
    validateDomain("admin", "user@gmail.com", "acme.com", "temp_abc123"),
    "active",
  );
  assert.equal(
    validateDomain("admin", "user@gmail.com", "", "temp_xyz789"),
    "active",
  );
});

test("dev bypass UIDs skip domain validation", () => {
  assert.equal(
    validateDomain("admin", "user@gmail.com", "acme.com", "dev-admin-uid"),
    "active",
  );
  assert.equal(
    validateDomain("admin", "user@gmail.com", "acme.com", "dev-employee-uid"),
    "active",
  );
});

test("development environment skips domain validation", () => {
  assert.equal(
    validateDomain("admin", "user@gmail.com", "acme.com", "uid-123", "development"),
    "active",
  );
});

test("matching domain with subdomain returns active", () => {
  assert.equal(
    validateDomain("admin", "user@sub.acme.com", "sub.acme.com", "uid-123"),
    "active",
  );
});

test("case insensitive domain matching returns active", () => {
  assert.equal(
    validateDomain("admin", "user@Acme.COM", "acme.com", "uid-123"),
    "active",
  );
});

// ─── requireEmailVerified middleware ──────────────────────────────────────

function createEmailVerifiedApp(
  setupFirebaseUser: (req: any) => void,
) {
  const app = express();

  app.use("/dashboard", (req: any, _res, next) => {
    setupFirebaseUser(req);
    next();
  });

  app.use("/dashboard", requireEmailVerified);

  app.get("/dashboard/stats", (_req, res) => {
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

// Guardar NODE_ENV original y forzar production para probar el middleware
// (el middleware salta en NODE_ENV !== "production")
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
process.env.NODE_ENV = "production";

test("requireEmailVerified: verified email passes through", async () => {
  const app = createEmailVerifiedApp((req) => {
    req.firebaseUser = {
      uid: "user-verified-123",
      email: "user@acme.com",
      email_verified: true,
    };
  });

  await withTestServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/dashboard/stats`);
    assert.equal(res.status, 200);

    const payload = (await res.json()) as { ok?: boolean };
    assert.equal(payload.ok, true);
  });
});

test("requireEmailVerified: unverified email returns 403", async () => {
  const app = createEmailVerifiedApp((req) => {
    req.firebaseUser = {
      uid: "user-unverified-123",
      email: "user@acme.com",
      email_verified: false,
    };
  });

  await withTestServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/dashboard/stats`);
    assert.equal(res.status, 403);

    const payload = (await res.json()) as { error?: string; blocked?: boolean };
      assert.equal(payload.error, "email_no_verificado");
      assert.equal(payload.blocked, true);
  });
});

test("requireEmailVerified: temp_ UID skips verification check", async () => {
  const app = createEmailVerifiedApp((req) => {
    req.firebaseUser = {
      uid: "temp_invited-user-456",
      email: "invited@other.com",
      email_verified: false,
    };
  });

  await withTestServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/dashboard/stats`);
    assert.equal(res.status, 200);
  });
});

test("requireEmailVerified: dev bypass UID skips verification check", async () => {
  const app = createEmailVerifiedApp((req) => {
    req.firebaseUser = {
      uid: "dev-admin-uid",
      email: "admin@tempos.es",
      email_verified: false,
    };
  });

  await withTestServer(app, async (baseUrl) => {
    const res = await fetch(`${baseUrl}/dashboard/stats`);
    assert.equal(res.status, 200);
  });
});

// ─── sendPendingApproval integration ──────────────────────────────────────

test("registration with non-matching domain calls sendPendingApproval", async () => {
  const app = express();
  app.use(express.json());

  // Inject a firebase user (mimics firebaseAuthMiddleware)
  app.use((req: any, _res, next) => {
    req.firebaseUser = {
      uid: "integration-test-uid-999",
      email: "user@gmail.com",
      email_verified: true,
      name: "Test User",
      admin: true,
    };
    next();
  });

  // Mock DB repository
  const originalGetRepository = AppDataSource.getRepository;
  AppDataSource.getRepository = (() => ({
    findOne: async () => null,
    create: (data: any) => data,
    save: async (data: any) => data,
  })) as any;

  // Mock EmailService.sendPendingApproval
  let capturedArgs: any[] = [];
  const originalSendPendingApproval = EmailService.sendPendingApproval;
  EmailService.sendPendingApproval = ((...args: any[]) => {
    capturedArgs = args;
    return Promise.resolve();
  }) as any;

  // Register handler using validateDomain helper (env defaults to "production")
  app.post(
    "/api/v1/auth/register",
    asyncHandler(async (req, res) => {
      const firebaseUser = (req as any).firebaseUser;

      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json(buildValidationError(parsed.error));
        return;
      }
      const body = parsed.data;

      const companyDomain =
        typeof body.companyDomain === "string"
          ? body.companyDomain.trim()
          : "";

      const registrationStatus = validateDomain(
        body.role || "employee",
        firebaseUser.email,
        companyDomain,
        firebaseUser.uid,
        "production",
      );

      const user = {
        uid: firebaseUser.uid,
        email: firebaseUser.email.toLowerCase(),
        displayName: body.name || "Test User",
        role: "admin",
        status: registrationStatus,
      };

      if (registrationStatus === "pending") {
        await EmailService.sendPendingApproval(
          user.email,
          user.displayName,
          companyDomain || "No proporcionado",
        );
      }

      res.status(201).json({
        message: "Registro exitoso",
        data: {
          uid: user.uid,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }),
  );

  try {
    await withTestServer(app, async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          role: "admin",
          companyDomain: "acme.com",
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json() as { data?: { status?: string } };
      assert.equal(data.data?.status, "pending");

      assert.equal(capturedArgs.length, 3);
      assert.equal(capturedArgs[0], "user@gmail.com");
      assert.equal(capturedArgs[1], "Test User");
      assert.equal(capturedArgs[2], "acme.com");
    });
  } finally {
    AppDataSource.getRepository = originalGetRepository;
    EmailService.sendPendingApproval = originalSendPendingApproval;
  }
});

// Restaurar NODE_ENV
process.env.NODE_ENV = ORIGINAL_NODE_ENV;
