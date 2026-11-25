import test from 'node:test';
import assert from 'node:assert/strict';
import { PIONEER_CAP, isValidated, stepOf, mergeFlags, canPayout } from '../server/lib/pioneers.js';

const done = { login_ok: true, u2a_done: true, a2u_done: false };

test('plafond : 5 pionniers validés au maximum', () => {
  assert.equal(PIONEER_CAP, 5);
  assert.equal(canPayout({ row: done, validatedCount: 4 }).ok, true);
  const r = canPayout({ row: done, validatedCount: 5 });
  assert.equal(r.ok, false); assert.equal(r.status, 403); assert.match(r.reason, /5 pionniers sur 5/);
  assert.equal(canPayout({ row: done, validatedCount: 9 }).ok, false);
});

test('envoi : sans paiement de test préalable, un seul envoi par compte', () => {
  assert.equal(canPayout({ row: null, validatedCount: 0 }).ok, true);
  assert.equal(canPayout({ row: { login_ok: true, u2a_done: false, a2u_done: false }, validatedCount: 0 }).ok, true);
  const again = canPayout({ row: { ...done, a2u_done: true }, validatedCount: 0 });
  assert.equal(again.ok, false); assert.equal(again.status, 409);
});

test('idempotence : une étape faite le reste, rejouer ne change rien', () => {
  const a = mergeFlags(null, { login_ok: true });
  const b = mergeFlags(a, { login_ok: true });
  assert.deepEqual(a, b);
  const c = mergeFlags({ ...done }, { login_ok: false, u2a_done: false });
  assert.deepEqual(c, { login_ok: true, u2a_done: true, a2u_done: false });
  assert.deepEqual(mergeFlags(c, { a2u_done: true }), { login_ok: true, u2a_done: true, a2u_done: true });
});

test('validation = connexion + envoi reçu ; étape affichée', () => {
  assert.equal(isValidated(done), false);
  assert.equal(isValidated({ login_ok: true, u2a_done: false, a2u_done: true }), true);
  assert.equal(isValidated({ ...done, a2u_done: true }), true);
  assert.equal(stepOf(null), 0); assert.equal(stepOf({ login_ok: true }), 1); assert.equal(stepOf(done), 2); assert.equal(stepOf({ ...done, a2u_done: true }), 3);
});
