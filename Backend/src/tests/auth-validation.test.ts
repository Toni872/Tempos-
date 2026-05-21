import assert from "node:assert/strict";
import { test } from "node:test";
import { updateAuthProfileSchema } from "../utils/validation.js";

test("updateAuthProfileSchema acepta displayName valido", () => {
  const result = updateAuthProfileSchema.safeParse({
    displayName: "Antonio Dev",
  });
  assert.equal(result.success, true);
});

test("updateAuthProfileSchema rechaza displayName vacio o demasiado corto", () => {
  const shortName = updateAuthProfileSchema.safeParse({ displayName: "A" });
  const emptyName = updateAuthProfileSchema.safeParse({ displayName: "   " });

  assert.equal(shortName.success, false);
  assert.equal(emptyName.success, false);
});

test("updateAuthProfileSchema rechaza displayName excesivamente largo", () => {
  const longName = "a".repeat(121);
  const result = updateAuthProfileSchema.safeParse({ displayName: longName });

  assert.equal(result.success, false);
});

// ─── registerSchema ────────────────────────────────────────────────────────

import { registerSchema } from "../utils/validation.js";

test("registerSchema acepta un dominio valido", () => {
  const result = registerSchema.safeParse({
    companyDomain: "acme.com",
  });
  assert.equal(result.success, true);
});

test("registerSchema acepta companyDomain opcional (ausente)", () => {
  const result = registerSchema.safeParse({});
  assert.equal(result.success, true);
});

test("registerSchema acepta companyDomain vacio", () => {
  const result = registerSchema.safeParse({ companyDomain: "" });
  assert.equal(result.success, true);
});

test("registerSchema acepta companyDomain con guiones y subdominios", () => {
  const result = registerSchema.safeParse({
    companyDomain: "sub.domain.co.uk",
  });
  assert.equal(result.success, true);
});

test("registerSchema acepta companyDomain con valor valido junto a otros campos", () => {
  const result = registerSchema.safeParse({
    name: "Admin User",
    role: "admin",
    companyName: "Acme Inc",
    companyDomain: "acme.com",
  });
  assert.equal(result.success, true);
});
