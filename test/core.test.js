import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTotals, unitPrice, toUnits } from '../server/lib/pricing.js';
import { checkPaymentMatchesOrder } from '../server/lib/payments.js';
import { orderSchema, productSchema } from '../server/lib/validate.js';

const user = { id: 'u1', pi_uid: 'pi-1' };
const order = { id: 'o1', user_id: 'u1', total_pi: '12.3' };
const pay = (over = {}) => ({ user_uid: 'pi-1', amount: 12.3, metadata: { orderId: 'o1' }, status: {}, ...over });

test('prix: promo uniquement si inférieure', () => {
  assert.equal(unitPrice({ price_pi: 10, promo_price_pi: 8 }), 8);
  assert.equal(unitPrice({ price_pi: 10, promo_price_pi: 12 }), 10);
  assert.equal(unitPrice({ price_pi: 10, promo_price_pi: null }), 10);
});
test('totaux sans erreur d\'arrondi flottant', () => {
  const t = computeTotals([{ unit_price_pi: 0.1, qty: 3 }, { unit_price_pi: 0.2, qty: 1 }], 0.1);
  assert.equal(t.subtotal, 0.5); assert.equal(t.total, 0.6);
  assert.equal(toUnits(12.3), toUnits('12.3000000'));
});
test('paiement valide', () => assert.deepEqual(checkPaymentMatchesOrder(pay(), order, user), { ok: true }));
test('paiement: montant différent refusé', () => assert.equal(checkPaymentMatchesOrder(pay({ amount: 1 }), order, user).reason, 'amount_mismatch'));
test('paiement: autre utilisateur Pi refusé', () => assert.equal(checkPaymentMatchesOrder(pay({ user_uid: 'x' }), order, user).reason, 'payment_user_mismatch'));
test('paiement: autre commande refusée', () => assert.equal(checkPaymentMatchesOrder(pay({ metadata: { orderId: 'o2' } }), order, user).reason, 'order_mismatch'));
test('paiement: commande d\'un autre client refusée', () => assert.equal(checkPaymentMatchesOrder(pay(), { ...order, user_id: 'u2' }, user).reason, 'order_user_mismatch'));
test('paiement: annulé refusé', () => assert.equal(checkPaymentMatchesOrder(pay({ status: { cancelled: true } }), order, user).reason, 'cancelled'));
test('commande: validation des entrées', () => {
  const ok = { items: [{ productId: crypto.randomUUID(), qty: 1 }], zoneId: crypto.randomUUID(), shipping: { full_name: 'Aïssata D', phone: '+229 01 23 45 67', commune: 'a', quartier: 'b', address: 'rue 1' } };
  assert.ok(orderSchema.parse(ok));
  assert.throws(() => orderSchema.parse({ ...ok, items: [{ productId: 'x', qty: 1 }] }));
  assert.throws(() => orderSchema.parse({ ...ok, items: [{ productId: crypto.randomUUID(), qty: 0 }] }));
  assert.throws(() => orderSchema.parse({ ...ok, shipping: { ...ok.shipping, phone: 'abc' } }));
});
test('produit: image doit être https ou chemin local', () => {
  const base = { name: 'Test', category_id: crypto.randomUUID(), price_pi: 1, stock: 1 };
  assert.ok(productSchema.parse({ ...base, images: ['https://x.y/a.jpg', '/img/a.jpg'] }));
  assert.throws(() => productSchema.parse({ ...base, images: ['javascript:alert(1)'] }));
});
