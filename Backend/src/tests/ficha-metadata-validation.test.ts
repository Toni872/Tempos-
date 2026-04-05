import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFichaSchema, updateFichaSchema } from '../utils/validation.js';

function buildBaseFichaPayload() {
  return {
    date: '2026-04-04',
    startTime: '09:00',
  };
}

test('createFichaSchema acepta metadata dentro de limites', () => {
  const payload = {
    ...buildBaseFichaPayload(),
    metadata: {
      location: 'Alicante',
      deviceId: 'kiosk-01',
      tags: ['office', 'morning'],
    },
  };

  const result = createFichaSchema.safeParse(payload);
  assert.equal(result.success, true);
});

test('createFichaSchema rechaza metadata con demasiadas claves en raiz', () => {
  const metadata = Object.fromEntries(
    Array.from({ length: 31 }, (_, i) => [`k${i}`, i]),
  );

  const result = createFichaSchema.safeParse({
    ...buildBaseFichaPayload(),
    metadata,
  });

  assert.equal(result.success, false);
});

test('updateFichaSchema rechaza metadata demasiado profunda', () => {
  const metadata = {
    a: { b: { c: { d: { e: { f: 'too-deep' } } } } },
  };

  const result = updateFichaSchema.safeParse({ metadata });
  assert.equal(result.success, false);
});

test('updateFichaSchema rechaza metadata demasiado grande', () => {
  const metadata = {
    notes: 'x'.repeat(9000),
  };

  const result = updateFichaSchema.safeParse({ metadata });
  assert.equal(result.success, false);
});
