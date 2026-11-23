// Éléments partagés : état, API, helpers. Aucune donnée sensible n'est stockée côté navigateur
// (seulement le jeton de session et le panier).
export const S = { user: null, token: null, cat: null, favs: new Set(), cart: [], config: { shopName: 'Éclat & Style' } };
export const acts = {};   // clic    : data-act="nom"
export const forms = {};  // submit  : data-form="nom"
export const changes = {}; // change : data-change="nom"

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
export { store };

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = (n) => `${Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 7 })} Pi`;
export const unit = (p) => (p.promo_price_pi != null && Number(p.promo_price_pi) < Number(p.price_pi) ? Number(p.promo_price_pi) : Number(p.price_pi));

const PALETTE = ['#efe3d3', '#f1d9d3', '#dfe6dc', '#e9dfc9'];
export const placeholder = (i = 0) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="${PALETTE[i % 4]}"/><text x="150" y="215" font-family="Georgia" font-size="90" fill="#b48a3c" text-anchor="middle">É</text></svg>`);

export async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(S.token ? { Authorization: `Bearer ${S.token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && S.token) logout();
    throw new Error(d.error || 'Une erreur est survenue. Réessayez.');
  }
  return d;
}

let tt;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(tt); tt = setTimeout(() => { t.hidden = true; }, 3800);
}
export const go = (hash) => { location.hash = hash; };

export function saveSession(token, user) { S.token = token; S.user = user; store.set('session', { token, user }); }
export function logout() { S.token = null; S.user = null; S.favs = new Set(); store.del('session'); }
export function saveCart() {
  store.set('cart', S.cart);
  const n = S.cart.reduce((s, l) => s + l.qty, 0);
  const b = document.getElementById('cart-count'); b.textContent = n; b.hidden = n === 0;
}
