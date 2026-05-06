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
