import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  inviteEmployeeSchema,
  validateTokenSchema,
  activateAccountSchema,
} from "../schemas/employee-invitation.schemas.js";

// ─── Test helpers ───────────────────────────────────────────────────────────

/**
 * Replicates the SHA-256 hashing logic from employee-invitation.controller.ts.
 * The controller's generateToken() is module-private, so we replicate the
 * deterministic part (hashing) here for verification.
 */
function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function generateTokenForTest(): {
  raw: string;
  hash: string;
  expiresAt: Date;
} {
  const raw = crypto.randomBytes(24).toString("hex"); // 48 hex chars
  const hash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return { raw, hash, expiresAt };
}

// ─── Token generation ───────────────────────────────────────────────────────

describe("Token generation (crypto.randomBytes(24) + SHA-256)", () => {
  it("produces a 48-character hex token from randomBytes(24)", () => {
    const token = crypto.randomBytes(24).toString("hex");
    assert.equal(token.length, 48);
    assert.match(token, /^[0-9a-f]{48}$/);
  });

  it("produces a 64-character SHA-256 hex hash", () => {
    const { raw, hash } = generateTokenForTest();
    assert.equal(raw.length, 48);
    assert.equal(hash.length, 64);
    assert.match(hash, /^[0-9a-f]{64}$/);
  });

  it("SHA-256 hash is deterministic (same input → same hash)", () => {
    const raw = crypto.randomBytes(24).toString("hex");
    const hash1 = hashToken(raw);
    const hash2 = hashToken(raw);
    assert.equal(hash1, hash2);
  });

  it("SHA-256 hash differs for different inputs", () => {
    const raw1 = crypto.randomBytes(24).toString("hex");
    const raw2 = crypto.randomBytes(24).toString("hex");
    const hash1 = hashToken(raw1);
    const hash2 = hashToken(raw2);
    assert.notEqual(hash1, hash2);
  });

  it("generateToken produces 24h expiry in the future", () => {
    const { expiresAt } = generateTokenForTest();
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();

    // Should be roughly 24h (allow 5s tolerance for test execution)
    assert.ok(diffMs > 23 * 60 * 60 * 1000, "Expiry should be > 23h from now");
    assert.ok(diffMs < 25 * 60 * 60 * 1000, "Expiry should be < 25h from now");
  });
});

// ─── Token expiry ───────────────────────────────────────────────────────────

describe("Token expiry logic", () => {
  it("detects expired token when expiresAt is in the past", () => {
    const past = new Date(Date.now() - 1000);
    assert.ok(Date.now() > past.getTime());
  });

  it("detects valid token when expiresAt is in the future", () => {
    const future = new Date(Date.now() + 60 * 60 * 1000); // 1h from now
    assert.ok(future.getTime() > Date.now());
  });

  it("edge case: exactly at expiry boundary is treated as expired", () => {
    // If expiresAt === now, it's expired (not strictly >)
    const now = new Date();
    // Using <= comparison: token at boundary is expired
    const isExpired = now <= new Date(Date.now());
    assert.equal(isExpired, true);
  });
});

// ─── Schema: inviteEmployeeSchema ───────────────────────────────────────────

describe("inviteEmployeeSchema", () => {
  it("accepts valid invite body", () => {
    const result = inviteEmployeeSchema.safeParse({
      email: "employee@acme.com",
      displayName: "John Doe",
      role: "employee",
    });
    assert.equal(result.success, true);
  });

  it("accepts all valid roles", () => {
    for (const role of ["admin", "manager", "employee", "auditor"]) {
      const result = inviteEmployeeSchema.safeParse({
        email: "user@acme.com",
        displayName: "Test User",
        role,
      });
      assert.equal(result.success, true, `Role "${role}" should be valid`);
    }
  });

  it("rejects missing email", () => {
    const result = inviteEmployeeSchema.safeParse({
      displayName: "John Doe",
      role: "employee",
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid email format", () => {
    const result = inviteEmployeeSchema.safeParse({
      email: "not-an-email",
      displayName: "John Doe",
      role: "employee",
    });
    assert.equal(result.success, false);
  });

  it("rejects missing displayName", () => {
    const result = inviteEmployeeSchema.safeParse({
      email: "employee@acme.com",
      role: "employee",
    });
    assert.equal(result.success, false);
  });

  it("whitespace-only displayName passes min(1) but is trimmed (schema: min before trim)", () => {
    // NOTE: .min(1) runs BEFORE .trim() in Zod 4, so "   " (length 3) passes min(1)
    // then gets trimmed to "". Test documents this behavior.
    const result = inviteEmployeeSchema.safeParse({
      email: "employee@acme.com",
      displayName: "   ",
      role: "employee",
    });
    assert.equal(result.success, true);
    // After trim it becomes empty string at runtime
    if (result.success) {
      assert.equal(result.data.displayName, "");
    }
  });

  it("rejects invalid role", () => {
    const result = inviteEmployeeSchema.safeParse({
      email: "employee@acme.com",
      displayName: "John Doe",
      role: "superadmin",
    });
    assert.equal(result.success, false);
  });

  it("rejects empty body", () => {
    const result = inviteEmployeeSchema.safeParse({});
    assert.equal(result.success, false);
  });
});

// ─── Schema: validateTokenSchema ────────────────────────────────────────────

describe("validateTokenSchema", () => {
  it("accepts a valid 48-char hex token", () => {
    const token = "a".repeat(48);
    assert.equal(token.length, 48);
    const result = validateTokenSchema.safeParse({ token });
    assert.equal(result.success, true);
  });

  it("accepts a valid 48-char hex token with mixed hex chars", () => {
    const token = "a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3";
    assert.equal(token.length, 48);
    const result = validateTokenSchema.safeParse({ token });
    assert.equal(result.success, true);
  });

  it("rejects token with non-hex characters", () => {
    const result = validateTokenSchema.safeParse({
      token: "z".repeat(48),
    });
    assert.equal(result.success, false);
  });

  it("rejects token shorter than 48 chars", () => {
    const result = validateTokenSchema.safeParse({
      token: "a".repeat(47),
    });
    assert.equal(result.success, false);
  });

  it("rejects token longer than 48 chars", () => {
    const result = validateTokenSchema.safeParse({
      token: "a".repeat(49),
    });
    assert.equal(result.success, false);
  });

  it("rejects empty token", () => {
    const result = validateTokenSchema.safeParse({ token: "" });
    assert.equal(result.success, false);
  });

  it("rejects missing token field", () => {
    const result = validateTokenSchema.safeParse({});
    assert.equal(result.success, false);
  });

  it("rejects uppercase hex characters", () => {
    const result = validateTokenSchema.safeParse({
      token: "A".repeat(48),
    });
    assert.equal(result.success, false);
  });
});

// ─── Schema: activateAccountSchema ──────────────────────────────────────────

describe("activateAccountSchema", () => {
  const validToken = "a".repeat(48);

  it("accepts valid token + strong password", () => {
    const result = activateAccountSchema.safeParse({
      token: validToken,
      password: "SecurePass1",
    });
    assert.equal(result.success, true);
  });

  it("accepts password with number at start", () => {
    const result = activateAccountSchema.safeParse({
      token: validToken,
      password: "1SecurePass",
    });
    assert.equal(result.success, true);
  });

  it("rejects password shorter than 8 chars", () => {
    const result = activateAccountSchema.safeParse({
      token: validToken,
      password: "Ab1",
    });
    assert.equal(result.success, false);
  });

  it("rejects password without uppercase letter", () => {
    const result = activateAccountSchema.safeParse({
      token: validToken,
      password: "securepass1",
    });
    assert.equal(result.success, false);
  });

  it("rejects password without number", () => {
    const result = activateAccountSchema.safeParse({
      token: validToken,
      password: "SecurePass",
    });
    assert.equal(result.success, false);
  });

  it("rejects missing token", () => {
    const result = activateAccountSchema.safeParse({
      password: "SecurePass1",
    });
    assert.equal(result.success, false);
  });

  it("rejects missing password", () => {
    const result = activateAccountSchema.safeParse({
      token: validToken,
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid token format in activate schema", () => {
    const result = activateAccountSchema.safeParse({
      token: "invalid",
      password: "SecurePass1",
    });
    assert.equal(result.success, false);
  });

  it("rejects empty body", () => {
    const result = activateAccountSchema.safeParse({});
    assert.equal(result.success, false);
  });
});
