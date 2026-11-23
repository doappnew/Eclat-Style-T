import { S, acts, forms, changes, store, esc, fmt, unit, placeholder, api, toast, go, saveSession, logout, saveCart } from './core.js';
import { hasPi, login, pay } from './pi.js';
import { PAGES } from './pages.js';

const view = document.getElementById('view');
const STATUS = {
  awaiting_payment: 'En attente de paiement', paid: 'Payée et confirmée', preparing: 'En préparation',
  shipping: 'En cours de livraison', delivered: 'Livrée', cancelled: 'Annulée', refunded: 'Remboursée',
};
export const statusLabel = (s) => STATUS[s] || s;
const PAGE = 12;

const img = (p, i = 0) => esc(p.images?.[0] || placeholder(i));
const catName = (id) => S.cat.categories.find((c) => c.id === id)?.name || '';
const prod = (id) => S.cat.products.find((p) => p.id === id);

function card(p, i) {
  const promo = unit(p) < Number(p.price_pi);
  return `<article class="card">
    <button class="fav ${S.favs.has(p.id) ? 'on' : ''}" data-act="fav" data-id="${p.id}" aria-label="Favori"><svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z"/></svg></button>
    <a href="#/product/${p.id}"><div class="ph"><img loading="lazy" src="${img(p, i)}" alt="${esc(p.name)}">
      ${p.stock < 1 ? '<span class="tag">Épuisé</span>' : promo ? '<span class="tag promo">Promo</span>' : p.is_new ? '<span class="tag">Nouveau</span>' : ''}</div>
    <div class="body"><h3>${esc(p.name)}</h3><div class="price">${fmt(unit(p))}${promo ? `<span class="old">${fmt(p.price_pi)}</span>` : ''}</div></div></a>
    <div class="actions">${p.stock < 1 ? '<button class="btn sm" disabled>Épuisé</button>'
      : `<button class="btn sm gold" data-act="quick" data-id="${p.id}">${p.variants?.length ? 'Choisir' : 'Ajouter'}</button><button class="btn sm" data-act="quickbuy" data-id="${p.id}">Acheter</button>`}</div></article>`;
}

// ---------- Vues ----------
async function home() {
  const { categories, products } = S.cat;
  const cats = categories.map((c, i) => {
    const items = products.filter((x) => x.category_id === c.id); const p = items[0];
    return `<a class="tile" href="#/catalog?cat=${c.slug}"><img loading="lazy" src="${img(p || {}, i)}" alt=""><span>${esc(c.name)}<small>${items.length} produit${items.length > 1 ? 's' : ''}</small></span></a>`;
  }).join('');
  const sections = categories.map((c) => {
    const items = products.filter((p) => p.category_id === c.id);
    if (!items.length) return '';
    return `<section id="cat-${c.slug}"><div class="sec"><h2>${esc(c.name)}</h2><a href="#/catalog?cat=${c.slug}">Voir tout (${items.length})</a></div>
      <div class="grid">${items.slice(0, 4).map(card).join('')}</div></section>`;
  }).join('');
  const news = products.filter((p) => p.is_new && p.stock > 0).slice(0, 10);
  const ic = (d) => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
  const heroImg = '/img/hero.jpg';
  const hello = S.user ? `<span class="hello">Bonjour ${esc(S.user.username)}</span>` : '';
  const cta = S.user
    ? '<a class="btn gold" href="#/catalog">Découvrir la boutique</a>'
    : `<button class="btn gold" data-act="login" type="button">Se connecter avec votre compte Pi</button><a class="btn light" href="#/catalog">Découvrir la boutique</a>`;
  return `<section class="hero"><img src="${esc(heroImg)}" alt=""><div class="hero-in">${hello}<div class="eyebrow">Beauté · Bijoux · Mode</div>
    <h1>Révélez votre <em>éclat</em>,<br>affirmez votre style.</h1>
    <p>Une sélection élégante, payée en Pi et livrée chez vous.</p><div class="cta">${cta}</div></div></section>
    <div class="trust">
      <div>${ic('M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 1 0 0-.01M17 19a1.5 1.5 0 1 0 0-.01')}Livraison organisée par la boutique</div>
      <div>${ic('M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Zm-3 9 2 2 4-4')}Paiement sécurisé en Pi</div>
      <div>${ic('M12 3l2.6 5.4 5.9.9-4.3 4.1 1 5.9L12 16.5 6.8 19.3l1-5.9L3.5 9.3l5.9-.9L12 3Z')}Sélection de qualité</div></div>
    <form data-form="search"><input class="search" name="q" placeholder="Rechercher un produit…" aria-label="Rechercher"></form>
    ${S.user ? '' : `<div class="loginband"><h3>Pionniers, bienvenue</h3><p>Connectez-vous en un geste avec votre compte Pi pour commander, payer en Pi et suivre vos livraisons.</p><button class="btn gold" data-act="login" type="button">Se connecter avec Pi</button></div>`}
    <div class="sec"><h2>Nos catégories</h2></div><div class="tiles">${cats}</div>
    ${news.length ? `<div class="band"><div class="sec"><h2>Nouveautés</h2><a href="#/catalog?sort=new">Tout voir</a></div><div class="hrail">${news.map(card).join('')}</div></div>` : ''}
    <div class="big-title"><h1>Nos produits</h1><div class="orn">✦</div><p>Classés par catégorie, prix en Pi</p></div>
    ${sections}`;
}

function catalog(_m, q) {
  const cat = q.get('cat') || ''; const text = (q.get('q') || '').trim().toLowerCase();
  const sort = q.get('sort') || 'new'; const stock = q.get('stock') === '1'; const n = Number(q.get('n')) || PAGE;
  let list = S.cat.products.filter((p) => (!cat || S.cat.categories.find((c) => c.id === p.category_id)?.slug === cat)
    && (!text || `${p.name} ${p.description}`.toLowerCase().includes(text)) && (!stock || p.stock > 0));
  if (sort === 'asc') list.sort((a, b) => unit(a) - unit(b));
  if (sort === 'desc') list.sort((a, b) => unit(b) - unit(a));
  if (sort === 'new') list.sort((a, b) => Number(b.is_new) - Number(a.is_new));
  const total = list.length; list = list.slice(0, n);
  const chip = (slug, name) => `<a class="chip ${cat === slug ? 'on' : ''}" href="#/catalog?${new URLSearchParams({ cat: slug, q: text, sort }).toString()}">${esc(name)}</a>`;
  return `<h1>Catalogue</h1>
    <form data-form="search"><input class="search" name="q" value="${esc(text)}" placeholder="Rechercher par nom ou type de produit…"><input type="hidden" name="cat" value="${esc(cat)}"></form>
    <div class="chips">${chip('', 'Tout')}${S.cat.categories.map((c) => chip(c.slug, c.name)).join('')}</div>
    <div class="row" style="margin-bottom:14px"><select data-change="filter" data-key="sort" class="grow" aria-label="Tri">
      <option value="new" ${sort === 'new' ? 'selected' : ''}>Nouveautés</option><option value="asc" ${sort === 'asc' ? 'selected' : ''}>Prix croissant</option><option value="desc" ${sort === 'desc' ? 'selected' : ''}>Prix décroissant</option></select>
      <label style="margin:0;white-space:nowrap"><input type="checkbox" data-change="filter" data-key="stock" ${stock ? 'checked' : ''} style="width:auto"> En stock</label></div>
    <p class="muted">${total} produit${total > 1 ? 's' : ''}</p>
    <div class="grid">${list.map(card).join('') || '<p>Aucun produit trouvé.</p>'}</div>
    ${total > n ? `<p style="text-align:center;margin-top:18px"><button class="btn ghost" data-act="more" data-n="${n + PAGE}">Voir plus</button></p>` : ''}`;
}

function product([id]) {
  const p = prod(id);
  if (!p) return '<p>Produit introuvable.</p>';
  const imgs = p.images?.length ? p.images : [placeholder()];
  const promo = unit(p) < Number(p.price_pi);
  const vars = (p.variants || []).map((v, i) => `<label>${esc(v.name)}</label><select data-var="${i}" data-name="${esc(v.name)}">${v.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`).join('');
  return `<a href="#/catalog" class="muted">← Catalogue</a>
    <div class="gallery" style="margin-top:8px"><img id="main-img" src="${esc(imgs[0])}" alt="${esc(p.name)}"></div>
    ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((u, i) => `<img src="${esc(u)}" class="${i ? '' : 'on'}" data-act="thumb" alt="">`).join('')}</div>` : ''}
    <div class="muted">${esc(catName(p.category_id))}${p.is_demo ? ' · image de démonstration' : ''}</div>
    <h1>${esc(p.name)}</h1>
    <div class="price" style="font-size:1.4rem">${fmt(unit(p))}${promo ? `<span class="old">${fmt(p.price_pi)}</span>` : ''}</div>
    <p>${esc(p.description)}</p>
    <p class="${p.stock > 0 ? 'okc' : 'err'}">${p.stock > 5 ? 'En stock' : p.stock > 0 ? `Plus que ${p.stock} en stock` : 'Épuisé'}</p>
    ${vars}
    <label>Quantité</label><div class="qty"><button data-act="pqty" data-d="-1">−</button><span id="pq">1</span><button data-act="pqty" data-d="1">+</button></div>
    <div style="margin-top:18px;display:grid;gap:10px">
      <button class="btn gold block" data-act="add" data-id="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>Ajouter au panier</button>
      <button class="btn block" data-act="buy" data-id="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>Acheter maintenant</button>
      <button class="btn ghost block" data-act="fav" data-id="${p.id}">${S.favs.has(p.id) ? '♥ Retirer des favoris' : '♡ Ajouter aux favoris'}</button></div>`;
}

const cartLines = () => S.cart.map((l) => ({ ...l, p: prod(l.id) })).filter((l) => l.p);
const cartSub = () => cartLines().reduce((s, l) => s + unit(l.p) * l.qty, 0);

function cart() {
  const lines = cartLines();
  if (!lines.length) return '<h1>Mon panier</h1><p>Votre panier est vide.</p><a class="btn" href="#/catalog">Voir la boutique</a>';
  return `<h1>Mon panier</h1>${lines.map((l, i) => `<div class="line"><div class="im"><img src="${img(l.p)}" alt=""></div>
    <div class="grow"><strong>${esc(l.p.name)}</strong>${l.variant ? `<div class="muted">${esc(l.variant)}</div>` : ''}<div class="price">${fmt(unit(l.p))}</div>
    <div class="row" style="margin-top:6px"><div class="qty"><button data-act="cqty" data-i="${i}" data-d="-1">−</button><span>${l.qty}</span><button data-act="cqty" data-i="${i}" data-d="1">+</button></div>
    <button class="btn sm ghost" data-act="del" data-i="${i}">Retirer</button></div></div></div>`).join('')}
    <div class="panel" style="margin-top:14px"><div class="tot"><span>Sous-total</span><b>${fmt(cartSub())}</b></div>
    <div class="muted">Les frais de livraison sont calculés à l'étape suivante selon votre zone.</div></div>
    ${S.config.maxPayment ? `<div class="testnote">Phase de test : montant maximal par commande ${S.config.maxPayment} Pi.</div>` : ''}
    <a class="btn gold block" href="#/checkout">Commander</a>`;
}

let selZone = null;
function checkout() {
  const lines = cartLines();
  if (!lines.length) return '<h1>Commande</h1><p>Votre panier est vide.</p>';
  const zones = S.cat.zones;
  const z = zones.find((x) => x.id === selZone) || zones[0];
  selZone = z?.id;
  const fee = z ? Number(z.fee_pi) : 0;
  return `<h1>Commande</h1>
    <form data-form="checkout" class="panel"><h3>Informations de livraison</h3>
      <label>Nom et prénom</label><input name="full_name" required maxlength="120" autocomplete="name">
      <label>Téléphone</label><input name="phone" type="tel" required maxlength="30" autocomplete="tel">
      <label>Zone de livraison (pays — ville)</label>
      <select name="zoneId" data-change="zone">${zones.map((x) => `<option value="${x.id}" ${x.id === selZone ? 'selected' : ''}>${esc(x.country)} — ${esc(x.city)} (${fmt(x.fee_pi)})</option>`).join('')}</select>
      ${z?.eta ? `<div class="muted">Délai indicatif : ${esc(z.eta)}</div>` : ''}
      <label>Commune</label><input name="commune" required maxlength="120">
      <label>Quartier</label><input name="quartier" required maxlength="120">
      <label>Adresse précise ou point de repère</label><input name="address" required maxlength="300">
      <label>Instructions pour le livreur (facultatif)</label><textarea name="instructions" rows="2" maxlength="500"></textarea>
      <label>Nom du destinataire, s'il est différent (facultatif)</label><input name="recipient_name" maxlength="120">
      <div class="panel" style="margin:16px 0 0;background:var(--cream)">
        <div class="tot"><span>Sous-total</span><span>${fmt(cartSub())}</span></div>
        <div class="tot"><span>Livraison</span><span>${fmt(fee)}</span></div>
        <div class="tot big"><span>Total à payer</span><span>${fmt(cartSub() + fee)}</span></div>
        <div class="muted">Le montant définitif est recalculé et confirmé par le serveur avant le paiement.</div></div>
      ${S.config.maxPayment ? `<div class="testnote">Phase de test : montant maximal par commande ${S.config.maxPayment} Pi.</div>` : ''}
      <p class="muted">Paiement exclusivement en Pi, dans le Pi Browser.</p>
      <button class="btn gold block" id="pay-btn">${S.user ? 'Payer en Pi' : 'Se connecter et payer en Pi'}</button>
      <p id="pay-msg" class="err" role="alert"></p></form>`;
}

async function orders() {
  if (!S.user) return needLogin('Connectez-vous pour voir vos commandes.');
  const list = await api('/api/orders');
  return `<h1>Mes commandes</h1>${list.map((o) => `<a class="panel" href="#/order/${o.id}" style="display:block"><div class="row"><b class="grow">${esc(o.number)}</b><span class="badge ${o.status}">${statusLabel(o.status)}</span></div>
    <div class="muted">${new Date(o.created_at).toLocaleDateString('fr-FR')} · ${fmt(o.total_pi)}</div></a>`).join('') || '<p>Aucune commande pour le moment.</p>'}`;
}

const FLOW = ['paid', 'preparing', 'shipping', 'delivered'];
async function orderView([id], q) {
  if (!S.user) return needLogin('Connectez-vous pour voir cette commande.');
  const o = await api(`/api/orders/${encodeURIComponent(id)}`);
  const idx = FLOW.indexOf(o.status);
  const steps = ['paid', 'preparing', 'shipping', 'delivered'].map((s, i) => `<li class="${idx >= i ? 'done' : ''}">${statusLabel(s)}</li>`).join('');
  return `${q.get('ok') ? '<div class="panel okc"><b>Paiement réussi.</b> Votre commande est confirmée.</div>' : ''}
    <h1>${esc(o.number)}</h1><span class="badge ${o.status}">${statusLabel(o.status)}</span>
    ${o.status === 'awaiting_payment' ? `<div class="panel" style="margin-top:12px"><p>Le paiement n'a pas été confirmé.</p><button class="btn gold" data-act="retry" data-id="${o.id}" data-number="${esc(o.number)}" data-total="${o.total_pi}">Payer ${fmt(o.total_pi)}</button><p id="pay-msg" class="err"></p></div>` : ''}
    ${['cancelled', 'refunded', 'awaiting_payment'].includes(o.status) ? '' : `<ul class="steps">${steps}</ul>`}
    <div class="panel"><h3>Articles</h3>${o.order_items.map((i) => `<div class="tot"><span>${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ''} × ${i.qty}</span><span>${fmt(i.unit_price_pi * i.qty)}</span></div>`).join('')}
      <div class="tot"><span>Livraison</span><span>${fmt(o.delivery_fee_pi)}</span></div><div class="tot big"><span>Total</span><span>${fmt(o.total_pi)}</span></div></div>
    <div class="panel"><h3>Livraison</h3><div>${esc(o.recipient_name || o.full_name)} · ${esc(o.phone)}</div><div>${esc(o.address)}, ${esc(o.quartier)}, ${esc(o.commune)}</div><div>${esc(o.zone_city)}, ${esc(o.zone_country)}</div>
      ${o.eta_date ? `<div>Livraison estimée : ${new Date(o.eta_date).toLocaleDateString('fr-FR')}</div>` : o.zone_eta ? `<div class="muted">Délai indicatif : ${esc(o.zone_eta)}</div>` : ''}
      ${o.tracking_number ? `<div>Suivi : <b>${esc(o.tracking_number)}</b></div>` : ''}${o.admin_comment ? `<div class="muted">${esc(o.admin_comment)}</div>` : ''}</div>
    <a class="btn ghost block" href="#/page/contact">Contacter le service client</a>`;
}

async function favorites() {
  if (!S.user) return needLogin('Connectez-vous pour retrouver vos favoris.');
  const list = S.cat.products.filter((p) => S.favs.has(p.id));
  return `<h1>Favoris</h1><div class="grid">${list.map(card).join('') || '<p>Aucun favori pour le moment.</p>'}</div>`;
}

function needLogin(msg) {
  return `<h1>Connexion</h1><p>${esc(msg)}</p><button class="btn gold" data-act="login">Se connecter avec Pi</button><p id="pay-msg" class="err"></p>
    ${hasPi() ? '' : '<p class="muted">La connexion Pi fonctionne uniquement dans le Pi Browser.</p>'}`;
}

function account() {
  if (!S.user) return needLogin('Connectez-vous avec votre compte Pi pour commander et suivre vos achats.');
  return `<h1>Mon compte</h1><div class="panel"><b>${esc(S.user.username)}</b></div>
    <div class="panel"><a href="#/orders">Mes commandes</a><br><br><a href="#/favorites">Mes favoris</a>${S.user.role === 'admin' ? '<br><br><a href="#/admin"><b>Espace administration</b></a>' : ''}</div>
    <button class="btn ghost block" data-act="logout">Se déconnecter</button>`;
}

const page = ([name]) => {
  const p = PAGES[name];
  if (!p) return '<p>Page introuvable.</p>';
  const body = typeof p.body === 'function' ? p.body(S.config) : p.body;
  return `<article class="page"><h1>${esc(p.title)}</h1>${body}</article>`;
};

async function adminView(_m, q) {
  if (S.user?.role !== 'admin') return '<h1>Accès refusé</h1><p>Cet espace est réservé aux administrateurs.</p>';
  const mod = await import('./admin.js');
  return mod.render(q);
}

// ---------- Routeur ----------
const routes = [[/^\/$/, home], [/^\/catalog$/, catalog], [/^\/product\/(.+)$/, product], [/^\/cart$/, cart], [/^\/checkout$/, checkout],
  [/^\/orders$/, orders], [/^\/order\/(.+)$/, orderView], [/^\/favorites$/, favorites], [/^\/account$/, account], [/^\/page\/(.+)$/, page], [/^\/admin$/, adminView]];
let token = 0;
async function render() {
  const t = ++token;
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const q = new URLSearchParams(qs || '');
  const hit = routes.find(([re]) => re.test(path));
  view.innerHTML = '<div class="spin">Chargement…</div>';
  let html;
  try { html = hit ? await hit[1](path.match(hit[0]).slice(1), q) : '<p>Page introuvable.</p>'; } catch (e) { html = `<p class="err">${esc(e.message)}</p>`; }
  if (t !== token) return;
  view.innerHTML = html;
  window.scrollTo(0, 0);
  const hl = document.getElementById('hd-login');
  if (hl) { hl.textContent = S.user ? S.user.username : 'Connexion Pi'; hl.classList.toggle('on', !!S.user); hl.dataset.act = S.user ? 'account' : 'login'; }
  document.querySelectorAll('.tabbar a').forEach((a) => {
    const key = a.dataset.tab; const on = (key === 'home' && path === '/') || (key !== 'home' && path.includes(key === 'account' ? 'account' : key));
    a.classList.toggle('on', on);
  });
}

// ---------- Actions ----------
const msg = (t) => { const m = document.getElementById('pay-msg'); if (m) m.textContent = t || ''; };
const refreshFavs = async () => { if (S.user) { try { S.favs = new Set(await api('/api/favorites')); } catch { /* ignore */ } } };
const sel = () => { const v = {}; document.querySelectorAll('[data-var]').forEach((s) => { v[s.dataset.name] = s.value; }); return Object.entries(v).map(([k, x]) => `${k} : ${x}`).join(', ') || null; };
let pq = 1;

function addToCart(id) {
  const p = prod(id); if (!p) return false;
  const variant = sel();
  const l = S.cart.find((x) => x.id === id && x.variant === variant);
  const have = (l?.qty || 0) + pq;
  if (have > p.stock) { toast('Stock insuffisant'); return false; }
  if (l) l.qty = have; else S.cart.push({ id, qty: pq, variant });
  saveCart(); return true;
}

// Depuis une carte produit : un produit à variantes (taille, pointure) passe d'abord par sa fiche.
function quickAdd(id) {
  const p = prod(id); if (!p) return false;
  if (p.variants?.length) { toast('Choisissez d\'abord la taille ou la pointure'); go(`#/product/${id}`); return false; }
  const l = S.cart.find((x) => x.id === id && !x.variant);
  if ((l?.qty || 0) + 1 > p.stock) { toast('Stock insuffisant'); return false; }
  if (l) l.qty += 1; else S.cart.push({ id, qty: 1, variant: null });
  saveCart(); return true;
}

Object.assign(acts, {
  account: () => go('#/account'),
  login: async () => { try { await login(); await refreshFavs(); toast(`Bienvenue ${S.user.username}`); render(); } catch (e) { msg(e.message); } },
  logout: () => { logout(); render(); },
  thumb: (el) => { document.getElementById('main-img').src = el.src; document.querySelectorAll('.thumbs img').forEach((i) => i.classList.toggle('on', i === el)); },
  pqty: (el) => { const p = prod(location.hash.split('/')[2]); pq = Math.max(1, Math.min(p?.stock || 1, pq + Number(el.dataset.d))); document.getElementById('pq').textContent = pq; },
  add: (el) => { if (addToCart(el.dataset.id)) toast('Ajouté au panier'); },
  buy: (el) => { if (addToCart(el.dataset.id)) go('#/checkout'); },
  quick: (el) => { if (quickAdd(el.dataset.id)) toast('Ajouté au panier'); },
  quickbuy: (el) => { if (quickAdd(el.dataset.id)) go('#/checkout'); },
  cqty: (el) => { const l = S.cart[el.dataset.i]; const p = prod(l.id); l.qty = Math.max(1, Math.min(p.stock, l.qty + Number(el.dataset.d))); saveCart(); render(); },
  del: (el) => { S.cart.splice(el.dataset.i, 1); saveCart(); render(); },
  more: (el) => { const q = new URLSearchParams(location.hash.split('?')[1] || ''); q.set('n', el.dataset.n); history.replaceState(null, '', `#/catalog?${q}`); render(); },
  fav: async (el) => {
    if (!S.user) { toast('Connectez-vous pour utiliser les favoris'); return go('#/account'); }
    const id = el.dataset.id; const on = S.favs.has(id);
    try { await api(`/api/favorites/${id}`, { method: on ? 'DELETE' : 'PUT' }); on ? S.favs.delete(id) : S.favs.add(id); render(); } catch (e) { toast(e.message); }
  },
  retry: async (el) => {
    el.disabled = true;
    try { await pay({ id: el.dataset.id, number: el.dataset.number, total: el.dataset.total }); go(`#/order/${el.dataset.id}?ok=1`); render(); } catch (e) { msg(e.message); el.disabled = false; }
  },
});

forms.search = (f) => { const d = new FormData(f); const q = new URLSearchParams({ q: d.get('q') || '' }); if (d.get('cat')) q.set('cat', d.get('cat')); go(`#/catalog?${q}`); };
forms.checkout = async (f) => {
  const btn = document.getElementById('pay-btn'); btn.disabled = true; msg('');
  try {
    if (!S.user) { await login(); await refreshFavs(); }
    const d = Object.fromEntries(new FormData(f));
    const { zoneId, ...shipping } = d;
    const order = await api('/api/orders', { method: 'POST', body: { zoneId, shipping, items: S.cart.map((l) => ({ productId: l.id, qty: l.qty, variant: l.variant })) } });
    try {
      await pay(order);
    } catch (e) { msg(e.message); btn.disabled = false; toast('Commande enregistrée, en attente de paiement'); S.cart = []; saveCart(); go(`#/order/${order.id}`); return; }
    S.cart = []; saveCart(); go(`#/order/${order.id}?ok=1`);
  } catch (e) { msg(e.message); btn.disabled = false; }
};
changes.zone = (el) => { selZone = el.value; const data = Object.fromEntries(new FormData(el.form)); render().then(() => { const f = document.querySelector('[data-form=checkout]'); if (f) for (const [k, v] of Object.entries(data)) if (f.elements[k] && k !== 'zoneId') f.elements[k].value = v; }); };
changes.filter = (el) => {
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  if (el.type === 'checkbox') { el.checked ? q.set(el.dataset.key, '1') : q.delete(el.dataset.key); } else q.set(el.dataset.key, el.value);
  q.delete('n'); go(`#/catalog?${q}`);
};

document.addEventListener('click', (e) => { const el = e.target.closest('[data-act]'); if (el && acts[el.dataset.act]) { e.preventDefault(); acts[el.dataset.act](el); } });
document.addEventListener('submit', (e) => { const f = e.target.closest('[data-form]'); if (f && forms[f.dataset.form]) { e.preventDefault(); forms[f.dataset.form](f); } });
document.addEventListener('change', (e) => { const el = e.target.closest('[data-change]'); if (el && changes[el.dataset.change]) changes[el.dataset.change](el); });
window.addEventListener('hashchange', render);

// ---------- Plein écran (au premier toucher, si le navigateur le permet) ----------
document.addEventListener('click', () => { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); }, { once: true });

// ---------- Page de bienvenue (disparaît seule après ~3 s) ----------
const splash = document.getElementById('splash');
if (splash) { setTimeout(() => { splash.classList.add('hide'); setTimeout(() => splash.remove(), 800); }, 3200); }

// ---------- Démarrage ----------
(async () => {
  S.cart = store.get('cart') || []; saveCart();
  const ses = store.get('session');
  if (ses?.token) { S.token = ses.token; S.user = ses.user; }
  // Si le serveur dormait, le premier appel peut durer ~50 s : on prévient et on réessaie.
  view.innerHTML = '<div class="spin">Chargement…</div>';
  const wake = setTimeout(() => { view.innerHTML = '<div class="spin">La boutique se réveille, quelques secondes…</div>'; }, 4000);
  const retry = async (fn) => { for (let i = 0; ; i++) { try { return await fn(); } catch (e) { if (i >= 3) throw e; await new Promise((r) => setTimeout(r, 4000)); } } };
  try {
    const [cfg, cat] = await retry(() => Promise.all([api('/api/config'), api('/api/catalog')]));
    clearTimeout(wake);
    S.config = cfg; S.cat = cat;
    if (S.user) { try { const me = await api('/api/me'); S.user = me; store.set('session', { token: S.token, user: me }); await refreshFavs(); } catch { /* session expirée */ } }
  } catch (e) { clearTimeout(wake); view.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
  if (!hasPi()) { const n = document.getElementById('notice'); n.hidden = false; n.textContent = 'Pour vous connecter et payer en Pi, ouvrez cette boutique dans le Pi Browser. Vous pouvez parcourir le catalogue ici.'; }
  render();
})();
