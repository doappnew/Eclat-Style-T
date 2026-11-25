import { S, acts, forms, changes, store, esc, fmt, unit, placeholder, api, toast, go, saveSession, logout, saveCart } from './core.js';
import { hasPi, isSandbox, login, pay, requestTestnetPayout } from './pi.js';
import { PAGES } from './pages.js';
import { PAGES_EN } from './pages_en.js';
import { LANG, LOCALE, setLang, t } from './i18n.js';

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
    return `<a class="tile" href="#/catalog?cat=${c.slug}"><img loading="lazy" src="${img(p || {}, i)}" alt=""><span>${esc(c.name)}</span></a>`;
  }).join('');
  const sections = categories.map((c) => {
    const items = products.filter((p) => p.category_id === c.id);
    if (!items.length) return '';
    return `<section id="cat-${c.slug}"><div class="sec"><h2>${esc(c.name)}</h2><a href="#/catalog?cat=${c.slug}">Voir tout (${items.length})</a></div>
      <div class="grid">${items.slice(0, 4).map(card).join('')}</div></section>`;
  }).join('');
  const news = products.filter((p) => p.is_new && p.stock > 0).slice(0, 10);
  const ic = (d) => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
  const order = ['parfums', 'sacs', 'chaussures', 'bijoux', 'tenues', 'soins'];
  const slideImgs = ['/img/hero.jpg'];
  for (const slug of order) {
    const cat = categories.find((c) => c.slug === slug);
    const items = products.filter((p) => cat && p.category_id === cat.id && p.images?.[0]);
    const pick = items.find((p) => p.is_new) || items[0];
    if (pick) slideImgs.push(pick.images[0]);
  }
  while (slideImgs.length < 6) slideImgs.push(slideImgs[slideImgs.length - 1] || '/img/hero.jpg');
  const slides = slideImgs.slice(0, 6).map((src, i) => `<img class="slide" style="--i:${i}" src="${esc(src)}" alt="" ${i ? 'loading="lazy"' : ''}>`).join('');
  const hello = S.user ? `<span class="hello">Bonjour ${esc(S.user.username)}</span>` : '';
  const cta = S.user
    ? '<a class="btn gold" href="#/catalog">Découvrir la boutique</a>'
    : `<button class="btn gold" data-act="login" type="button">Se connecter avec Pi</button><a class="hero-link" href="#/catalog">Voir la boutique</a>`;
  return `<section class="hero"><div class="slides">${slides}</div><div class="hero-in">${hello}
    <h1>Révélez votre <em>éclat</em></h1>
    <p>Beauté, bijoux et mode, payés en Pi.</p><div class="cta">${cta}</div></div></section>
    <div class="sec"><h2>Catégories</h2></div><div class="tiles">${cats}</div>
    ${news.length ? `<div class="band"><div class="sec"><h2>Nouveautés</h2><a href="#/catalog?sort=new">Tout voir</a></div><div class="hrail">${news.map(card).join('')}</div></div>` : ''}
    <div class="big-title"><h1>Nos produits</h1><div class="orn">✦</div></div>
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
      <button class="btn block" data-act="buy" data-id="${p.id}" ${p.stock < 1 ? 'disabled' : ''}>Payer maintenant</button>
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
    ${S.config.maxPayment ? `<div class="testnote">${S.config.network === 'mainnet' ? 'Montant maximal par commande' : 'Phase de test : montant maximal par commande'} ${S.config.maxPayment} Pi.</div>` : ''}
    <a class="btn gold block" href="#/checkout">Commander</a>`;
}

let selZone = null; let selCont = null; let selCountry = null;
const CONTINENTS = ['Europe', 'Amérique', 'Afrique'];
const EU = ['France', 'Belgique', 'Royaume-Uni', 'Allemagne', 'Espagne', 'Italie', 'Suisse', 'Portugal', 'Pays-Bas', 'Luxembourg', 'Irlande', 'Autriche', 'Suède', 'Norvège', 'Danemark', 'Finlande', 'Pologne', 'Grèce', "Autres pays d'Europe"];
const AM = ['États-Unis', 'Canada', 'Mexique', 'Brésil', 'Haïti', 'Guadeloupe', 'Martinique', "Autres pays d'Amérique"];
const continentOf = (country) => (EU.includes(country) ? 'Europe' : AM.includes(country) ? 'Amérique' : 'Afrique');
function resolveZone(zones) {
  let z = zones.find((x) => x.id === selZone);
  if (z && (continentOf(z.country) !== (selCont || continentOf(z.country)) || z.country !== (selCountry || z.country))) z = null;
  if (!z) {
    selCont = selCont || continentOf((zones[0] || {}).country);
    const inCont = zones.filter((x) => continentOf(x.country) === selCont);
    selCountry = inCont.some((x) => x.country === selCountry) ? selCountry : inCont[0]?.country || null;
    z = inCont.find((x) => x.country === selCountry);
  }
  selCont = selCont || (z ? continentOf(z.country) : CONTINENTS[0]); selCountry = z?.country || selCountry; selZone = z?.id || null;
  return z;
}
function zonePicker(zones) {
  const inCont = zones.filter((x) => continentOf(x.country) === selCont);
  const rank = (c) => (c === 'Bénin' ? 0 : /^Autres/.test(c) ? 2 : 1);
  const countries = [...new Set(inCont.map((x) => x.country))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'fr'));
  const cities = inCont.filter((x) => x.country === selCountry);
  return `<label>Continent</label><select data-change="cont">${CONTINENTS.map((c) => `<option value="${c}" ${c === selCont ? 'selected' : ''}>${c}</option>`).join('')}</select>
    <label>Pays</label><select data-change="country">${countries.map((c) => `<option value="${esc(c)}" ${c === selCountry ? 'selected' : ''}>${esc(c)}</option>`).join('') || '<option value="">—</option>'}</select>
    <label>Ville</label><select name="zoneId" data-change="zone">${cities.map((x) => `<option value="${x.id}" ${x.id === selZone ? 'selected' : ''}>${esc(x.city)} (${fmt(x.fee_pi)})</option>`).join('') || '<option value="">—</option>'}</select>
    ${countries.length ? '' : '<div class="muted">Aucune zone disponible pour ce continent.</div>'}`;
}
function checkout() {
  const lines = cartLines();
  if (!lines.length) return '<h1>Commande</h1><p>Votre panier est vide.</p>';
  const zones = S.cat.zones;
  const z = resolveZone(zones);
  const fee = z ? Number(z.fee_pi) : 0;
  return `<h1>Commande</h1>
    <form data-form="checkout" class="panel"><h3>Informations de livraison</h3>
      <label>Nom et prénom</label><input name="full_name" required maxlength="120" autocomplete="name">
      <label>Téléphone</label><input name="phone" type="tel" required maxlength="30" autocomplete="tel">
      ${zonePicker(zones)}
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
      ${S.config.maxPayment ? `<div class="testnote">${S.config.network === 'mainnet' ? 'Montant maximal par commande' : 'Phase de test : montant maximal par commande'} ${S.config.maxPayment} Pi.</div>` : ''}
      <p class="muted">Paiement exclusivement en Pi, dans le Pi Browser.</p><p class="muted" style="margin-top:10px">En continuant, vous acceptez les <a href="#/page/conditions"><u>conditions d'utilisation</u></a> et la <a href="#/page/confidentialite"><u>politique de confidentialité</u></a>.</p>
      <button class="btn gold block" id="pay-btn">${S.user ? 'Payer en Pi' : 'Se connecter et payer en Pi'}</button>
      <p id="pay-msg" class="err" role="alert"></p></form>`;
}

async function orders() {
  if (!S.user) return needLogin('Connectez-vous pour voir vos commandes.');
  const list = await api('/api/orders');
  return `<h1>Mes commandes</h1>${list.map((o) => `<a class="panel" href="#/order/${o.id}" style="display:block"><div class="row"><b class="grow">${esc(o.number)}</b><span class="badge ${o.status}">${statusLabel(o.status)}</span></div>
    <div class="muted">${new Date(o.created_at).toLocaleDateString(LOCALE)} · ${fmt(o.total_pi)}</div>
    ${o.order_items?.length ? `<div class="muted" style="font-size:.85rem">${o.order_items.map((i) => `${esc(i.name)} × ${i.qty}`).join(', ')}</div>` : ''}</a>`).join('') || '<p>Aucune commande pour le moment.</p>'}`;
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
      ${o.eta_date ? `<div>Livraison estimée : ${new Date(o.eta_date).toLocaleDateString(LOCALE)}</div>` : o.zone_eta ? `<div class="muted">Délai indicatif : ${esc(o.zone_eta)}</div>` : ''}
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
    ${hasPi() ? '' : '<p class="muted">La connexion Pi fonctionne uniquement dans le Pi Browser.</p>'}
    <div class="panel muted" style="font-size:.8rem;line-height:1.7"><b>Diagnostic</b><br>Adresse ouverte : ${esc(location.origin)}<br>SDK Pi présent : ${hasPi() ? 'oui' : 'non'}<br>Mode sandbox : ${isSandbox() ? 'oui' : 'non'}<br>Version de l'app : ${APP_VERSION}</div>`;
}

async function account() {
  if (!S.user) return needLogin('Connectez-vous avec votre compte Pi pour commander et suivre vos achats.');
  let test = '';
  const on = !!S.config.testnetPayout;
  if (S.config.network === 'mainnet') return `<h1>Mon compte</h1><div class="panel"><b>${esc(S.user.username)}</b></div>${accountLinks()}`;
  let p = { count: 0, cap: 5, login_ok: true, u2a_done: false, a2u_done: false, validated: false };
  try { p = await api('/api/pioneer/me'); } catch { /* le suivi ne bloque jamais le compte */ }
  const ok = (v) => (v ? '<b class="okc">✔</b>' : '<b class="err">✖</b>');
  test = `<div class="panel"><h3>Test Testnet des pionniers</h3>
    <p class="muted" style="margin:0 0 8px">Réseau Pi Testnet : aucun Pi réel. Pionniers validés : ${p.count} / ${p.cap}</p>
    <div class="tot"><span>1 · Connexion</span>${ok(true)}</div>
    <div class="tot"><span>2 · Paiement de test (facultatif)</span>${ok(p.u2a_done)}</div>
    <div class="tot"><span>3 · Envoi de test reçu</span>${ok(p.a2u_done)}</div>
    ${p.validated ? '<p class="okc" style="margin:10px 0 0">Compte validé, merci !</p>' : ''}
    <br><button class="btn ghost block" data-act="payout" type="button" ${on ? '' : 'disabled style="opacity:.5"'}>Recevoir mon envoi de test (Testnet)</button>
    ${on ? '' : '<p class="muted" style="margin:8px 0 0">Test pas encore activé par l\'administrateur.</p>'}</div>`;
  return `<h1>Mon compte</h1><div class="panel"><b>${esc(S.user.username)}</b></div>${test}${accountLinks()}`;
}
const accountLinks = () => `<a class="btn gold block" href="#/orders" style="margin-bottom:12px">Mes commandes</a>
    <div class="panel"><a href="#/favorites">Mes favoris</a>${S.user.role === 'admin' ? '<br><br><a href="#/admin">Administration</a>' : ''}</div>
    <button class="btn ghost block" data-act="logout">Se déconnecter</button>`;

const page = ([name]) => {
  const p = (LANG === 'en' && PAGES_EN[name]) || PAGES[name];
  if (!p) return '<p>Page introuvable.</p>';
  const body = typeof p.body === 'function' ? p.body(S.config) : p.body;
  return `<article class="page"><h1>${esc(p.title)}</h1>${body}</article>`;
};

async function adminView(_m, q) {
  if (S.user?.role !== 'admin') return '<h1>Accès refusé</h1><p>Cet espace est réservé aux administrateurs.</p>';
  const mod = await import('./admin.js');
  return mod.render(q);
}

function welcome() {
  return `<section class="welcome"><img class="wlogo" src="/logo-mark.png" alt="" onerror="this.remove()"><h1>Éclat <em>&amp;</em> Style</h1>
    <p>Beauté, bijoux et mode, payés en Pi. Connectez-vous pour entrer dans la boutique.</p>
    <button class="btn gold" data-act="login" type="button">Se connecter avec Pi</button>
    <p id="pay-msg" class="err"></p>${hasPi() ? '' : '<p class="muted">La connexion Pi fonctionne uniquement dans le Pi Browser.</p>'}</section>`;
}
async function loadCatalog() { S.cat = await api('/api/catalog'); }

// ---------- Routeur ----------
const routes = [[/^\/$/, home], [/^\/catalog$/, catalog], [/^\/product\/(.+)$/, product], [/^\/cart$/, cart], [/^\/checkout$/, checkout],
  [/^\/orders$/, orders], [/^\/order\/(.+)$/, orderView], [/^\/favorites$/, favorites], [/^\/account$/, account], [/^\/page\/(.+)$/, page], [/^\/admin$/, adminView]];
let token = 0;
async function render() {
  const t = ++token;
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const q = new URLSearchParams(qs || '');
  const hit = routes.find(([re]) => re.test(path));
  const nt = document.getElementById('notice'); if (nt) { nt.hidden = true; nt.textContent = ''; }
  const gated = !S.user && !/^\/page\//.test(path);
  document.body.classList.toggle('gated', gated);
  if (gated) { view.innerHTML = welcome(); window.scrollTo(0, 0); return; }
  view.innerHTML = '<div class="spin">Chargement…</div>';
  let html;
  try { if (S.user && !S.cat) await loadCatalog(); html = hit ? await hit[1](path.match(hit[0]).slice(1), q) : '<p>Page introuvable.</p>'; } catch (e) { html = `<p class="err">${esc(e.message)}</p>`; }
  if (t !== token) return;
  view.innerHTML = html;
  window.scrollTo(0, 0);
  const hl = document.getElementById('hd-login');
  if (hl) { hl.textContent = S.user ? S.user.username : 'Connexion Pi'; hl.classList.toggle('on', !!S.user); hl.dataset.act = S.user ? 'account' : 'login'; }
  document.querySelectorAll('.tabbar a').forEach((a) => {
    const key = a.dataset.tab; const on = (key === 'home' && path === '/') || (key === 'orders' ? path.startsWith('/order') : key !== 'home' && path.includes(key));
    a.classList.toggle('on', on);
  });
}

// ---------- Actions ----------
const APP_VERSION = 'v23';
const msg = (t) => {
  const m = document.getElementById('pay-msg'); if (m) m.textContent = t || '';
  if (t) { const n = document.getElementById('notice'); n.hidden = false; n.textContent = t; n.scrollIntoView({ block: 'nearest' }); toast(t); }
};
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
  lang: () => setLang(LANG === 'en' ? 'fr' : 'en'),
  account: () => go('#/account'),
  payout: async (el) => { el.disabled = true; try { const r = await requestTestnetPayout(); toast(`Envoi de test reçu : ${r.amount} Pi (Testnet)`); render(); } catch (e) { toast(e.message || 'Envoi impossible'); } el.disabled = false; },
  login: async (el) => {
    const label = el?.textContent; if (el) { el.disabled = true; el.textContent = 'Connexion en cours…'; }
    const n = document.getElementById('notice'); n.hidden = true;
    try {
      await Promise.race([login(), new Promise((_, rej) => setTimeout(() => rej(new Error('Pi ne répond pas. Vérifiez que l\'application est ouverte dans le Pi Browser, enregistrée et validée dans le Portail développeur, puis réessayez.')), 30000))]);
      await refreshFavs(); toast(`Connexion réussie. Bienvenue ${S.user.username}`);
      if (location.hash && location.hash !== '#/') { go('#/'); } else render();
    } catch (e) { msg(e?.message || 'Connexion impossible. Réessayez.'); if (el) { el.disabled = false; el.textContent = label; } }
  },
  logout: () => { logout(); S.cat = null; if (location.hash !== '#/') go('#/'); else render(); },
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
const keepForm = () => { const f0 = document.querySelector('[data-form=checkout]'); const data = f0 ? Object.fromEntries(new FormData(f0)) : {}; render().then(() => { const f = document.querySelector('[data-form=checkout]'); if (f) for (const [k, v] of Object.entries(data)) if (f.elements[k] && k !== 'zoneId') f.elements[k].value = v; }); };
changes.cont = (el) => { selCont = el.value; selCountry = null; selZone = null; keepForm(); };
changes.country = (el) => { selCountry = el.value; selZone = null; keepForm(); };
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

// ---------- Barres masquées au défilement vers le bas, réaffichées vers le haut ----------
(() => {
  const bar = document.querySelector('.tabbar'); const top = document.querySelector('.top'); let last = window.scrollY; let idle;
  const show = () => { bar.classList.remove('hide'); top.classList.remove('hide'); };
  const hide = () => { bar.classList.add('hide'); top.classList.add('hide'); };
  window.addEventListener('scroll', () => {
    const y = window.scrollY; const d = y - last; clearTimeout(idle);
    const nearEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 80;
    if (y < 80 || d < -2 || nearEnd) show();            // en haut, en remontant ou en fin de page
    else if (d > 8) hide();                              // en descendant
    last = y;
    idle = setTimeout(show, 1200);                       // les barres reviennent toujours quand le défilement s'arrête
  }, { passive: true });
  document.addEventListener('touchstart', () => { if (bar.classList.contains('hide')) idle = setTimeout(show, 1200); }, { passive: true });
  window.addEventListener('hashchange', show);
})();

// ---------- Page de bienvenue (disparaît seule après ~3 s) ----------
const splash = document.getElementById('splash');
if (splash) { setTimeout(() => { splash.classList.add('hide'); setTimeout(() => splash.remove(), 800); }, 3200); }

// ---------- Démarrage ----------
{ const lb = document.getElementById('hd-lang'); if (lb) lb.textContent = LANG === 'en' ? 'FR' : 'EN'; }
(async () => {
  S.cart = store.get('cart') || []; saveCart();
  const ses = store.get('session');
  if (ses?.token) { S.token = ses.token; S.user = ses.user; }
  // Si le serveur dormait, le premier appel peut durer ~50 s : on prévient et on réessaie.
  view.innerHTML = '<div class="spin">Chargement…</div>';
  const wake = setTimeout(() => { view.innerHTML = '<div class="spin">La boutique se réveille, quelques secondes…</div>'; }, 4000);
  const retry = async (fn) => { for (let i = 0; ; i++) { try { return await fn(); } catch (e) { if (i >= 3) throw e; await new Promise((r) => setTimeout(r, 4000)); } } };
  try {
    const cfg = await retry(() => api('/api/config'));
    clearTimeout(wake);
    S.config = cfg;
    if (S.user) { try { const me = await api('/api/me'); S.user = me; store.set('session', { token: S.token, user: me }); await refreshFavs(); } catch { /* session expirée */ } }
  } catch (e) { clearTimeout(wake); view.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
  render();
})();
