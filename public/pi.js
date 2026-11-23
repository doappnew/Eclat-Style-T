// Intégration Pi : authentification et paiement. Fonctionne uniquement dans le Pi Browser.
import { api, saveSession, toast } from './core.js';

export const hasPi = () => typeof window.Pi !== 'undefined';
let ready = false;
let pending = [];

function init() {
  if (!hasPi()) throw new Error('Ouvrez cette boutique dans le Pi Browser pour vous connecter et payer en Pi.');
  if (!ready) { window.Pi.init({ version: '2.0' }); ready = true; }
}

// Le SDK signale un paiement resté en suspens avant que la session existe : on le traite après connexion.
const onIncomplete = (payment) => { pending.push(payment.identifier); };

export async function login() {
  init();
  const auth = await window.Pi.authenticate(['username', 'payments'], onIncomplete);
  // seul le jeton est envoyé : le serveur le vérifie auprès de Pi et décide de l'identité
  const d = await api('/api/auth/pi', { method: 'POST', body: { accessToken: auth.accessToken } });
  saveSession(d.token, d.user);
  const ids = pending; pending = [];
  for (const paymentId of ids) {
    try {
      const r = await api('/api/payments/incomplete', { method: 'POST', body: { paymentId } });
      if (r.action === 'completed') toast('Un paiement en attente a été finalisé.');
    } catch { /* sera retenté à la prochaine connexion */ }
  }
  return d.user;
}

// order = réponse du serveur ({id, number, total}) : le montant vient du serveur, jamais du panier.
export function pay(order) {
  init();
  return new Promise((resolve, reject) => {
    window.Pi.createPayment(
      { amount: Number(order.total), memo: `Commande ${order.number}`, metadata: { orderId: order.id } },
      {
        onReadyForServerApproval: (paymentId) => {
          api('/api/payments/approve', { method: 'POST', body: { paymentId } }).catch(reject);
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          api('/api/payments/complete', { method: 'POST', body: { paymentId, txid } }).then(() => resolve()).catch(reject);
        },
        onCancel: (paymentId) => {
          api('/api/payments/cancelled', { method: 'POST', body: { paymentId } }).catch(() => {});
          reject(new Error('Paiement annulé. Votre commande reste en attente de paiement.'));
        },
        onError: (err) => reject(new Error(err?.message || 'Le paiement Pi a échoué.')),
      },
    );
  });
}
