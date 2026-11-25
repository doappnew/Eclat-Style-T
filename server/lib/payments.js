import { toUnits } from './pricing.js';
import { checkPaymentNetwork } from './network.js';

// Vérifie qu'un paiement Pi (renvoyé par l'API Pi, pas par le navigateur) correspond bien à la commande et à l'utilisateur.
export function checkPaymentMatchesOrder(payment, order, user, network) {
  if (!payment || !order) return { ok: false, reason: 'not_found' };
  if (network) { const n = checkPaymentNetwork(payment, network); if (!n.ok) return n; }
  if (payment.user_uid !== user.pi_uid) return { ok: false, reason: 'payment_user_mismatch' };
  if (order.user_id !== user.id) return { ok: false, reason: 'order_user_mismatch' };
  if (payment.metadata?.orderId !== order.id) return { ok: false, reason: 'order_mismatch' };
  if (toUnits(payment.amount) !== toUnits(order.total_pi)) return { ok: false, reason: 'amount_mismatch' };
  if (payment.status?.cancelled || payment.status?.user_cancelled) return { ok: false, reason: 'cancelled' };
  return { ok: true };
}
