import test from 'node:test';
import assert from 'node:assert/strict';
import { networkOf, startupProblems, payoutOpen, checkPaymentNetwork, findBlacklistedBrands, buildChecklist, paymentCap } from '../server/lib/network.js';
import { checkPaymentMatchesOrder } from '../server/lib/payments.js';

test('réseau : testnet par défaut, valeurs invalides refusées', () => {
  assert.equal(networkOf({}), 'testnet');
  assert.equal(networkOf({ PI_NETWORK: 'Mainnet' }), 'mainnet');
  assert.throws(() => networkOf({ PI_NETWORK: 'autre' }));
});

test('démarrage : mainnet exige clé API et clé de validation', () => {
  assert.deepEqual(startupProblems({}), []);
  assert.equal(startupProblems({ PI_NETWORK: 'mainnet' }).length, 2);
  assert.deepEqual(startupProblems({ PI_NETWORK: 'mainnet', PI_API_KEY: 'k', PI_VALIDATION_KEY: 'v' }), []);
});

test('envoi de test : toujours fermé en mainnet', () => {
  const base = { TESTNET_PAYOUT: '1', PI_WALLET_SEED: 'x', PI_API_KEY: 'k' };
  assert.equal(payoutOpen({ ...base }), true);
  assert.equal(payoutOpen({ ...base, PI_NETWORK: 'mainnet' }), false);
  assert.equal(payoutOpen({ ...base, TESTNET_PAYOUT: '0' }), false);
});

test('paiement : le réseau doit correspondre', () => {
  assert.equal(checkPaymentNetwork({ network: 'Pi Network' }, 'mainnet').ok, true);
  assert.equal(checkPaymentNetwork({ network: 'Pi Testnet' }, 'mainnet').ok, false);
  assert.equal(checkPaymentNetwork({ network: 'Pi Network' }, 'testnet').ok, false);
  assert.equal(checkPaymentNetwork({ network: 'Pi Testnet' }, 'testnet').ok, true);
  assert.equal(checkPaymentNetwork({}, 'mainnet').ok, false);
  assert.equal(checkPaymentNetwork({}, 'testnet').ok, true);
});

test('paiement lié à la commande : contrôle de réseau branché', () => {
  const user = { id: 'u', pi_uid: 'p' }; const order = { id: 'o', user_id: 'u', total_pi: 1 };
  const pay = (network) => ({ user_uid: 'p', metadata: { orderId: 'o' }, amount: 1, status: {}, network });
  assert.equal(checkPaymentMatchesOrder(pay('Pi Testnet'), order, user, 'mainnet').reason, 'network_mismatch');
  assert.equal(checkPaymentMatchesOrder(pay('Pi Network'), order, user, 'mainnet').ok, true);
  assert.equal(checkPaymentMatchesOrder(pay('Pi Testnet'), order, user).ok, true);
});

test('marques de la liste noire', () => {
  assert.equal(findBlacklistedBrands(['Sac Louis Vuitton', 'Mocassin noir', 'Baskets NIKE', 'Dioramas']).length, 2);
  assert.equal(findBlacklistedBrands(['Parfum Barakkat Rouge 540']).length, 0);
});

test('liste de contrôle mainnet', () => {
  const env = { PI_NETWORK: 'mainnet', PI_API_KEY: 'k', PI_VALIDATION_KEY: 'v', CONTACT_EMAIL: 'a@b.c', CONTACT_PHONE: '1' };
  const ok = buildChecklist({ env, demoActive: 0, zones: [{ active: true, fee_pi: 1 }], productNames: ['Sac'], pagesOk: true });
  assert.ok(ok.every((r) => r.ok));
  const ko = buildChecklist({ env: {}, demoActive: 2, zones: [], productNames: ['Gucci sac'], pagesOk: false });
  assert.ok(ko.every((r) => !r.ok));
});

test('plafond : seulement si défini', () => {
  assert.equal(paymentCap({}), 0); assert.equal(paymentCap({ PI_MAX_PAYMENT: '0' }), 0); assert.equal(paymentCap({ PI_MAX_PAYMENT: 'x' }), 0);
  assert.equal(paymentCap({ PI_MAX_PAYMENT: '2' }), 2);
});
