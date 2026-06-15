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

import { registerSchema, validateCIF, isFreeEmail } from "../utils/validation.js";

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

// ─── validateCIF ─────────────────────────────────────────────────────────

test("validateCIF: valid CIF with numeric control returns true", () => {
  assert.equal(validateCIF("B12345679"), true);
});

test("validateCIF: valid CIF with letter control (letter entity) returns true", () => {
  assert.equal(validateCIF("P2345678H"), true);
});

test("validateCIF: lowercase input is normalized and returns true", () => {
  assert.equal(validateCIF("b12345679"), true);
});

test("validateCIF: invalid entity letter (Z) returns false", () => {
  assert.equal(validateCIF("Z12345678"), false);
});

test("validateCIF: wrong control digit returns false", () => {
  assert.equal(validateCIF("B12345678"), false);
});

test("validateCIF: NIF format starting with digit returns true (valid DNI)", () => {
  assert.equal(validateCIF("12345678Z"), true);
});

test("validateCIF: double letter prefix (PQ) returns false", () => {
  assert.equal(validateCIF("PQ1234567X"), false);
});

test("validateCIF: empty string returns false", () => {
  assert.equal(validateCIF(""), false);
});

test("validateCIF: null returns false", () => {
  assert.equal(validateCIF(null as any), false);
});

test("validateCIF: undefined returns false", () => {
  assert.equal(validateCIF(undefined as any), false);
});

test("validateCIF: too short (8 chars) returns false", () => {
  assert.equal(validateCIF("B1234567"), false);
});

test("validateCIF: too long (10 chars) returns false", () => {
  assert.equal(validateCIF("B123456789"), false);
});

// ─── isFreeEmail ─────────────────────────────────────────────────────────

test("isFreeEmail: gmail.com returns true", () => {
  assert.equal(isFreeEmail("test@gmail.com"), true);
});

test("isFreeEmail: hotmail.com returns true", () => {
  assert.equal(isFreeEmail("test@hotmail.com"), true);
});

test("isFreeEmail: outlook.com returns true", () => {
  assert.equal(isFreeEmail("test@outlook.com"), true);
});

test("isFreeEmail: corporate domain returns false", () => {
  assert.equal(isFreeEmail("admin@acme.com"), false);
});

test("isFreeEmail: uppercase free domain returns true (case insensitive)", () => {
  assert.equal(isFreeEmail("ADMIN@GMAIL.COM"), true);
});

test("isFreeEmail: empty string returns false", () => {
  assert.equal(isFreeEmail(""), false);
});

test("isFreeEmail: string without @ returns false", () => {
  assert.equal(isFreeEmail("noatsign"), false);
});

test("isFreeEmail: subdomain of free domain returns false", () => {
  assert.equal(isFreeEmail("test@sub.gmail.com"), false);
});

// ─── Register schema – CIF persistence ──────────────────────────────────

test("registerSchema acepta cif valido", () => {
  const result = registerSchema.safeParse({ cif: "B12345679" });
  assert.equal(result.success, true);
});

test("registerSchema acepta companyDomain + cif juntos", () => {
  const result = registerSchema.safeParse({
    role: "admin",
    companyName: "Acme Inc",
    companyDomain: "acme.com",
    cif: "B12345679",
  });
  assert.equal(result.success, true);
});

test("registerSchema rechaza cif invalido (wrong control)", () => {
  const result = registerSchema.safeParse({ cif: "B12345678" });
  assert.equal(result.success, false);
});

// ─── Registration status logic (mirrors auth.controller.ts) ──────────────

function determineRegistrationStatus(
  role: string,
  email: string,
  companyDomain: string,
  cif: string,
  uid: string,
  env: string = "production",
): "active" | "pending" {
  const DEV_BYPASS_UIDS = ["dev-admin-uid", "dev-employee-uid"];
  const skipDomainCheck =
    env === "development" ||
    uid.startsWith("temp_") ||
    DEV_BYPASS_UIDS.includes(uid);

  if (role !== "admin" || skipDomainCheck) return "active";

  const emailDomain = email.split("@")[1]?.toLowerCase();

  if (cif) {
    if (emailDomain && companyDomain && emailDomain === companyDomain.toLowerCase()) {
      return "active";
    }
    return "pending";
  }

  if (!companyDomain) return "pending";
  if (emailDomain && emailDomain !== companyDomain.toLowerCase()) return "pending";
  return "active";
}

test("determineRegistrationStatus: admin with valid CIF + matching domain returns active", () => {
  const status = determineRegistrationStatus(
    "admin", "user@acme.com", "acme.com", "B12345679", "uid-123",
  );
  assert.equal(status, "active");
});

test("determineRegistrationStatus: admin with CIF + mismatched domain returns pending", () => {
  const status = determineRegistrationStatus(
    "admin", "user@other.com", "acme.com", "B12345679", "uid-123",
  );
  assert.equal(status, "pending");
});

test("determineRegistrationStatus: admin with CIF + no companyDomain returns pending", () => {
  const status = determineRegistrationStatus(
    "admin", "user@acme.com", "", "B12345679", "uid-123",
  );
  assert.equal(status, "pending");
});

test("determineRegistrationStatus: admin without CIF + no companyDomain returns pending", () => {
  const status = determineRegistrationStatus(
    "admin", "user@acme.com", "", "", "uid-123",
  );
  assert.equal(status, "pending");
});

test("determineRegistrationStatus: admin without CIF + matching domain returns active", () => {
  const status = determineRegistrationStatus(
    "admin", "user@acme.com", "acme.com", "", "uid-123",
  );
  assert.equal(status, "active");
});

test("determineRegistrationStatus: admin without CIF + mismatched domain returns pending", () => {
  const status = determineRegistrationStatus(
    "admin", "user@gmail.com", "acme.com", "", "uid-123",
  );
  assert.equal(status, "pending");
});

test("determineRegistrationStatus: employee role always returns active regardless of domain", () => {
  const status = determineRegistrationStatus(
    "employee", "user@gmail.com", "acme.com", "", "uid-123",
  );
  assert.equal(status, "active");
});

test("determineRegistrationStatus: dev bypass UID skips domain check", () => {
  const status = determineRegistrationStatus(
    "admin", "user@gmail.com", "", "", "dev-admin-uid",
  );
  assert.equal(status, "active");
});

test("determineRegistrationStatus: temp_ UID skips domain check", () => {
  const status = determineRegistrationStatus(
    "admin", "user@gmail.com", "acme.com", "", "temp_abc123",
  );
  assert.equal(status, "active");
});

test("determineRegistrationStatus: development env skips domain check", () => {
  const status = determineRegistrationStatus(
    "admin", "user@gmail.com", "acme.com", "", "uid-123", "development",
  );
  assert.equal(status, "active");
});

// ─── Free email rejection for admin registration ────────────────────────

test("registerSchema + isFreeEmail: schema accepts free email body but isFreeEmail rejects it", () => {
  const body = { role: "admin", companyDomain: "gmail.com" };
  const email = "admin@gmail.com";

  const parsed = registerSchema.safeParse(body);
  assert.equal(parsed.success, true);

  const freeEmailBlocked = isFreeEmail(email);
  assert.equal(freeEmailBlocked, true);
});
