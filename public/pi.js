// Intégration Pi : authentification et paiement. Fonctionne uniquement dans le Pi Browser.
import { api, saveSession, toast } from './core.js';

export const hasPi = () => typeof window.Pi !== 'undefined';
// Le « Run in Sandbox » du Portail ouvre la boutique dans un cadre sandbox.minepi.com : le SDK doit alors être initialisé en mode sandbox.
// Hors sandbox (ouverture directe), rien ne change : Pi.init({ version: '2.0' }).
export const isSandbox = () => {
  try {
    const anc = Array.from(window.location.ancestorOrigins || []).join(' ');
    return window.top !== window.self && /sandbox\.minepi\.com/.test(`${anc} ${document.referrer}`);
  } catch { return false; }
};
let ready = false;
let pending = [];

function init() {
  if (!hasPi()) throw new Error('Ouvrez cette boutique dans le Pi Browser pour vous connecter et payer en Pi.');
  if (!ready) { window.Pi.init(isSandbox() ? { version: '2.0', sandbox: true } : { version: '2.0' }); ready = true; }
}

// Le SDK signale un paiement resté en suspens avant que la session existe : on le traite après connexion.
const onIncomplete = (payment) => { pending.push(payment.identifier); };

const errText = (e) => (typeof e === 'string' ? e : e?.message || e?.error || JSON.stringify(e) || 'erreur inconnue');

export async function login() {
  init();
  let auth;
  try {
    auth = await window.Pi.authenticate(['username', 'payments'], onIncomplete);
  } catch (e) {
    const message = errText(e).slice(0, 300);
    // le message exact du SDK est montré à l'utilisateur et envoyé au serveur (journaux Render : « auth: échec SDK »)
    fetch('/api/client-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, origin: location.origin }) }).catch(() => {});
    throw new Error(`Pi : ${message}`);
  }
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

// Envoi de test (Testnet) : l'autorisation « wallet_address » est demandée seulement au clic sur ce bouton.
export async function requestTestnetPayout() {
  init();
  await window.Pi.authenticate(['username', 'payments', 'wallet_address'], onIncomplete);
  return api('/api/testnet-payout', { method: 'POST', body: {} });
}
