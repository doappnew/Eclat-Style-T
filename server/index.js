import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { ZodError } from 'zod';
import { seedZones } from './lib/zones.js';
import { piMe, makePiPayments, PiError } from './lib/pi.js';
import { computeTotals, unitPrice } from './lib/pricing.js';
import { checkPaymentMatchesOrder } from './lib/payments.js';
import { orderSchema, productSchema, zoneSchema, orderPatchSchema } from './lib/validate.js';

const env = process.env;
if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET (32+ caractères) manquant');
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY manquants');

const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const pi = makePiPayments(env.PI_API_KEY || '');
const here = path.dirname(fileURLToPath(import.meta.url));

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
import { PIONEER_CAP, isValidated, stepOf, mergeFlags, canPayout } from './lib/pioneers.js';

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const must = ({ data, error }) => { if (error) throw error; return data; };
const log = (event, detail = {}) => db.from('events').insert({ event, detail }).then(() => {}, () => {});


// ---------- Suivi du test Testnet des pionniers (n'interrompt jamais la connexion ni le paiement) ----------
async function markPioneer(userId, patch) {
  try {
    const row = (await db.from('pioneer_test').select('*').eq('user_id', userId).maybeSingle()).data;
    const flags = mergeFlags(row, patch);
    if (row && flags.login_ok === row.login_ok && flags.u2a_done === row.u2a_done && flags.a2u_done === row.a2u_done) return;
    await db.from('pioneer_test').upsert({ user_id: userId, ...flags, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  } catch (e) { console.error(`pioneer: suivi impossible ${String(e?.message || e).slice(0, 120)}`); }
}
const pioneerRow = async (userId) => (await db.from('pioneer_test').select('*').eq('user_id', userId).maybeSingle()).data || null;
async function validatedCount() {
  const { count } = await db.from('pioneer_test').select('user_id', { count: 'exact', head: true }).eq('login_ok', true).eq('u2a_done', true).eq('a2u_done', true);
  return count || 0;
}

const app = express();
app.set('trust proxy', 1);
// En-têtes de sécurité (réactivation progressive, STRICT_HEADERS) :
//   (vide) = étape A : helmet SANS CSP, sans frameguard ni COOP (la connexion Pi fonctionne)
//   1      = helmet avec CSP complète (étape B, à tester plus tard)
//   0      = aucun en-tête helmet (retour arrière)
if (env.STRICT_HEADERS === '1') {
  app.use(helmet({
    frameguard: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://sdk.minepi.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.minepi.com', 'https://*.minepi.com'],
        frameSrc: ["'self'", 'https://*.minepi.com', 'https://*.pinet.com'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'", 'https://*.minepi.com', 'https://minepi.com', 'https://*.pinet.com', 'https://pinet.com'],
      },
    },
  }));
} else if (env.STRICT_HEADERS !== '0') {
  app.use(helmet({
    contentSecurityPolicy: false,
    frameguard: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));
}

app.use(express.json({ limit: '6mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));
const strict = rateLimit({ windowMs: 15 * 60 * 1000, limit: 80, standardHeaders: true, legacyHeaders: false });

// Point de contrôle léger (sert au service d'éveil et aux moniteurs externes)
app.get('/healthz', (_req, res) => res.set('Cache-Control', 'no-store').json({ ok: true }));

// Vérification du domaine dans le Developer Portal
// Adresses simples pour le Portail développeur Pi
app.get('/confidentialite', (_req, res) => res.redirect(302, '/#/page/confidentialite'));
app.get('/privacy', (_req, res) => res.redirect(302, '/#/page/confidentialite'));
app.get(['/conditions', '/terms'], (_req, res) => res.redirect(302, '/#/page/conditions'));
app.get('/validation-key.txt', (_req, res) => res.type('text/plain').send(env.PI_VALIDATION_KEY || ''));

// ---------- Authentification ----------
const sign = (u) => jwt.sign({ sub: u.id }, env.SESSION_SECRET, { expiresIn: '7d' });

async function loadUser(req, _res, next) {
  try {
    const h = req.headers.authorization || '';
    if (h.startsWith('Bearer ')) {
      const { sub } = jwt.verify(h.slice(7), env.SESSION_SECRET);
      // le rôle est relu en base à chaque appel
      const { data } = await db.from('users').select('id, pi_uid, username, role').eq('id', sub).maybeSingle();
      req.user = data || null;
    }
  } catch { req.user = null; }
  next();
}
app.use('/api', loadUser);
const requireAuth = (req, _res, next) => (req.user ? next() : next(new HttpError(401, 'Connexion requise')));
const requireAdmin = (req, _res, next) => (req.user?.role === 'admin' ? next() : next(new HttpError(403, 'Accès réservé aux administrateurs')));

// Erreurs du SDK Pi côté navigateur (aucun jeton ni donnée personnelle : 300 caractères, texte nettoyé)
app.post('/api/client-log', strict, (req, res) => {
  const raw = String(req.body?.message ?? '').replace(/[\r\n\t]+/g, ' ').replace(/[A-Za-z0-9_\-.]{40,}/g, '[masqué]').slice(0, 300);
  const origin = String(req.body?.origin ?? '').replace(/[^\w:/.\-]/g, '').slice(0, 100);
  console.error(`auth: échec SDK ${raw} (${origin})`);
  res.json({ ok: true });
});

app.post('/api/auth/pi', strict, wrap(async (req, res) => {
  const token = String(req.body?.accessToken || '');
  if (token.length < 10) throw new HttpError(400, 'Jeton manquant');
  let me;
  try { me = await piMe(token); } catch (e) {
    if (e instanceof PiError) { console.error(`auth: API Pi GET /me ${e.status} ${e.code}`.slice(0, 200)); throw new HttpError(401, 'Connexion Pi refusée. Ouvrez l\'application dans le Pi Browser.'); }
    throw e;
  }
  const user = must(await db.from('users')
    .upsert({ pi_uid: me.uid, username: me.username, last_login_at: new Date().toISOString() }, { onConflict: 'pi_uid' })
    .select('id, pi_uid, username, role').single());
  await markPioneer(user.id, { login_ok: true });
  res.json({ token: sign(user), user: { username: user.username, role: user.role } });
}));

app.get('/api/me', requireAuth, (req, res) => res.json({ username: req.user.username, role: req.user.role }));

// ---------- Boutique publique ----------
app.get('/api/config', (_req, res) => res.json({
  shopName: env.SHOP_NAME || 'Éclat & Style', contactEmail: env.CONTACT_EMAIL || '', contactPhone: env.CONTACT_PHONE || '',
  maxPayment: Number(env.PI_MAX_PAYMENT) || 0,
  testnetPayout: env.TESTNET_PAYOUT === '1' && !!env.PI_WALLET_SEED,
}));

app.get('/api/catalog', requireAuth, wrap(async (_req, res) => {
  const [categories, products, zones] = await Promise.all([
    db.from('categories').select('*').order('sort'),
    db.from('products').select('id, category_id, name, description, price_pi, promo_price_pi, images, stock, is_new, variants, is_demo').eq('active', true).order('created_at', { ascending: false }),
    db.from('delivery_zones').select('id, country, city, fee_pi, eta').eq('active', true).order('country'),
  ]);
  res.json({ categories: must(categories), products: must(products), zones: must(zones) });
}));

// ---------- Favoris ----------
app.get('/api/favorites', requireAuth, wrap(async (req, res) => {
  res.json(must(await db.from('favorites').select('product_id').eq('user_id', req.user.id)).map((r) => r.product_id));
}));
app.put('/api/favorites/:pid', requireAuth, wrap(async (req, res) => {
  must(await db.from('favorites').upsert({ user_id: req.user.id, product_id: req.params.pid }, { onConflict: 'user_id,product_id' }));
  res.json({ ok: true });
}));
app.delete('/api/favorites/:pid', requireAuth, wrap(async (req, res) => {
  must(await db.from('favorites').delete().eq('user_id', req.user.id).eq('product_id', req.params.pid));
  res.json({ ok: true });
}));

// ---------- Commandes ----------
const orderNumber = () => `ES-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

app.post('/api/orders', requireAuth, strict, wrap(async (req, res) => {
  const body = orderSchema.parse(req.body);
  const ids = [...new Set(body.items.map((i) => i.productId))];
  const products = must(await db.from('products').select('*').in('id', ids).eq('active', true));
  const zone = must(await db.from('delivery_zones').select('*').eq('id', body.zoneId).eq('active', true).maybeSingle());
  if (!zone) throw new HttpError(400, 'Zone de livraison indisponible');

  const qtyById = {};
  const lines = body.items.map((i) => {
    const p = products.find((x) => x.id === i.productId);
    if (!p) throw new HttpError(400, 'Produit indisponible');
    qtyById[p.id] = (qtyById[p.id] || 0) + i.qty;
    if (qtyById[p.id] > p.stock) throw new HttpError(409, `Stock insuffisant : ${p.name}`);
    return { product_id: p.id, name: p.name, unit_price_pi: unitPrice(p), qty: i.qty, variant: i.variant || null };
  });
  // prix, frais et total sont décidés ICI, jamais par le navigateur
  const totals = computeTotals(lines, zone.fee_pi);
  const cap = Number(env.PI_MAX_PAYMENT);
  if (cap > 0 && totals.total > cap) throw new HttpError(400, `Montant maximal autorisé pendant la phase de test : ${cap} Pi. Réduisez votre panier.`);

  const order = must(await db.from('orders').insert({
    number: orderNumber(), user_id: req.user.id, status: 'awaiting_payment',
    subtotal_pi: totals.subtotal, delivery_fee_pi: totals.fee, total_pi: totals.total,
    zone_country: zone.country, zone_city: zone.city, zone_eta: zone.eta, ...body.shipping,
  }).select('id, number, total_pi').single());
  const ins = await db.from('order_items').insert(lines.map((l) => ({ ...l, order_id: order.id })));
  if (ins.error) { await db.from('orders').delete().eq('id', order.id); throw ins.error; }
  res.json({ id: order.id, number: order.number, total: Number(order.total_pi), ...totals });
}));

const ORDER_COLS = 'id, number, status, subtotal_pi, delivery_fee_pi, total_pi, full_name, phone, zone_country, zone_city, zone_eta, commune, quartier, address, instructions, recipient_name, tracking_number, admin_comment, eta_date, paid_at, created_at, order_items(name, qty, unit_price_pi, variant)';

app.get('/api/orders', requireAuth, wrap(async (req, res) => {
  res.json(must(await db.from('orders').select(ORDER_COLS).eq('user_id', req.user.id).order('created_at', { ascending: false })));
}));
app.get('/api/orders/:id', requireAuth, wrap(async (req, res) => {
  const o = must(await db.from('orders').select(ORDER_COLS).eq('id', req.params.id).eq('user_id', req.user.id).maybeSingle());
  if (!o) throw new HttpError(404, 'Commande introuvable');
  res.json(o);
}));

// ---------- Paiements Pi ----------
async function getPayment(id) {
  try { return await pi.get(id); } catch (e) {
    if (e instanceof PiError) throw new HttpError(e.status === 404 ? 404 : 502, 'Paiement introuvable côté Pi');
    throw e;
  }
}
const orderOf = async (id) => (id ? must(await db.from('orders').select('id, user_id, status, total_pi, payment_id').eq('id', id).maybeSingle()) : null);

app.post('/api/payments/approve', requireAuth, strict, wrap(async (req, res) => {
  const paymentId = String(req.body?.paymentId || '');
  const payment = await getPayment(paymentId);
  const order = await orderOf(payment.metadata?.orderId);
  const chk = checkPaymentMatchesOrder(payment, order, req.user);
  if (!chk.ok) { await log('approve_refused', { paymentId, reason: chk.reason }); throw new HttpError(400, `Paiement refusé (${chk.reason})`); }
  if (order.status !== 'awaiting_payment') throw new HttpError(409, 'Commande déjà traitée');

  if (order.payment_id && order.payment_id !== paymentId) {
    // un ancien paiement n'est écrasé que s'il est annulé côté Pi
    const old = await pi.get(order.payment_id).catch(() => null);
    if (old && !(old.status?.cancelled || old.status?.user_cancelled)) throw new HttpError(409, 'Un autre paiement est déjà en cours pour cette commande');
  }
  const upd = await db.from('orders').update({ payment_id: paymentId, updated_at: new Date().toISOString() }).eq('id', order.id);
  if (upd.error) throw new HttpError(409, 'Paiement déjà associé à une autre commande');
  if (!payment.status?.developer_approved) await pi.approve(paymentId);
  await log('payment_approved', { paymentId, orderId: order.id });
  res.json({ ok: true });
}));

async function completeFlow(payment, user, clientTxid) {
  const order = await orderOf(payment.metadata?.orderId);
  const chk = checkPaymentMatchesOrder(payment, order, user);
  if (!chk.ok) throw new HttpError(400, `Paiement refusé (${chk.reason})`);
  if (order.payment_id !== payment.identifier) throw new HttpError(409, 'Paiement non associé à la commande');
  const txid = payment.transaction?.txid || clientTxid;
  if (!txid) throw new HttpError(400, 'Transaction manquante');
  if (clientTxid && payment.transaction?.txid && clientTxid !== payment.transaction.txid) throw new HttpError(400, 'Transaction incohérente');
  if (!payment.status?.developer_completed) await pi.complete(payment.identifier, txid);
  const result = must(await db.rpc('finalize_paid_order', { p_order: order.id, p_txid: txid }));
  await log('payment_completed', { paymentId: payment.identifier, orderId: order.id, result });
  if (result === 'paid' || result === 'already') await markPioneer(user.id, { u2a_done: true });
  return { orderId: order.id, result };
}

app.post('/api/payments/complete', requireAuth, strict, wrap(async (req, res) => {
  const paymentId = String(req.body?.paymentId || '');
  const payment = await getPayment(paymentId);
  const out = await completeFlow(payment, req.user, req.body?.txid ? String(req.body.txid) : null);
  res.json({ ok: true, ...out });
}));

// Paiement resté en suspens (renvoyé par le SDK à la connexion)
app.post('/api/payments/incomplete', requireAuth, strict, wrap(async (req, res) => {
  const paymentId = String(req.body?.paymentId || '');
  const payment = await getPayment(paymentId);
  if (payment.user_uid !== req.user.pi_uid) throw new HttpError(403, 'Paiement étranger');
  if (payment.status?.cancelled || payment.status?.user_cancelled) return res.json({ ok: true, action: 'none' });
  if (payment.transaction?.txid) {
    const out = await completeFlow(payment, req.user, null);
    return res.json({ ok: true, action: 'completed', ...out });
  }
  await pi.cancel(paymentId).catch(() => {});
  await db.from('orders').update({ payment_id: null }).eq('payment_id', paymentId).eq('status', 'awaiting_payment');
  res.json({ ok: true, action: 'cancelled' });
}));

app.post('/api/payments/cancelled', requireAuth, wrap(async (req, res) => {
  const paymentId = String(req.body?.paymentId || '');
  await db.from('orders').update({ payment_id: null }).eq('payment_id', paymentId).eq('user_id', req.user.id).eq('status', 'awaiting_payment');
  res.json({ ok: true });
}));

app.get('/api/pioneer/me', requireAuth, wrap(async (req, res) => {
  const row = await pioneerRow(req.user.id);
  res.json({ login_ok: !!row?.login_ok, u2a_done: !!row?.u2a_done, a2u_done: !!row?.a2u_done, validated: isValidated(row), count: await validatedCount(), cap: PIONEER_CAP });
}));

// ---------- Envoi de test (Testnet) : de l'application vers l'utilisateur (A2U) ----------
// Fermé par défaut : actif seulement si TESTNET_PAYOUT=1 et PI_WALLET_SEED défini (variables Render, jamais dans le code).
// Montant fixé par le serveur, un seul envoi par compte, plafond de comptes, réseau « Pi Testnet » vérifié.
const PAYOUT_AMOUNT = Math.min(Number(env.TESTNET_PAYOUT_AMOUNT) || 0.1, 1);
app.post('/api/testnet-payout', strict, requireAuth, wrap(async (req, res) => {
  if (env.TESTNET_PAYOUT !== '1' || !env.PI_WALLET_SEED || !env.PI_API_KEY) throw new HttpError(404, 'Indisponible');
  const uid = req.user.id;
  const existing = (await db.from('testnet_payouts').select('status').eq('user_id', uid).maybeSingle()).data;
  if (existing && existing.status !== 'failed') throw new HttpError(409, 'Un envoi de test a déjà été effectué pour ce compte.');
  const verdict = canPayout({ row: await pioneerRow(uid), validatedCount: await validatedCount() });
  if (!verdict.ok) throw new HttpError(verdict.status, verdict.reason);
  must(await db.from('testnet_payouts').upsert({ user_id: uid, amount: PAYOUT_AMOUNT, status: 'pending', payment_id: null, txid: null }, { onConflict: 'user_id' }));
  let paymentId = null;
  try {
    const { default: PiNetwork } = await import('pi-backend');
    const sdk = new PiNetwork(env.PI_API_KEY, env.PI_WALLET_SEED);
    paymentId = await sdk.createPayment({ amount: PAYOUT_AMOUNT, memo: 'Envoi de test', metadata: { kind: 'testnet-payout', userId: uid }, uid: req.user.pi_uid });
    await db.from('testnet_payouts').update({ payment_id: paymentId }).eq('user_id', uid);
    const created = await sdk.getPayment(paymentId);
    if (created.network !== 'Pi Testnet') { await sdk.cancelPayment(paymentId); throw new Error('network_not_testnet'); }
    const txid = await sdk.submitPayment(paymentId);
    await db.from('testnet_payouts').update({ txid }).eq('user_id', uid);
    await sdk.completePayment(paymentId, txid);
    await db.from('testnet_payouts').update({ status: 'completed' }).eq('user_id', uid);
    await markPioneer(uid, { a2u_done: true });
    console.log(`payout: terminé ${paymentId}`);
    res.json({ ok: true, amount: PAYOUT_AMOUNT });
  } catch (e) {
    console.error(`payout: échec ${paymentId || '-'} ${e?.response?.status || ''} ${e?.response?.data?.error || e?.message || 'erreur'}`.slice(0, 300));
    await db.from('testnet_payouts').update({ status: 'failed' }).eq('user_id', uid);
    throw new HttpError(502, 'L\'envoi de test a échoué. Réessayez dans un instant.');
  }
}));

// ---------- Administration ----------
const admin = express.Router();
admin.use(requireAuth, requireAdmin);

admin.get('/pioneers', wrap(async (_req, res) => {
  const rows = must(await db.from('pioneer_test').select('user_id, login_ok, u2a_done, a2u_done, created_at, updated_at, users(username)').order('updated_at', { ascending: false }).limit(200));
  const list = rows.map((r) => ({ username: r.users?.username || '—', step: stepOf(r), validated: isValidated(r), login_ok: r.login_ok, u2a_done: r.u2a_done, a2u_done: r.a2u_done, updated_at: r.updated_at }));
  res.json({ cap: PIONEER_CAP, count: list.filter((x) => x.validated).length, list });
}));
admin.get('/orders', wrap(async (_req, res) => {
  res.json(must(await db.from('orders').select(ORDER_COLS + ', payment_id, txid, needs_review').order('created_at', { ascending: false }).limit(300)));
}));
admin.patch('/orders/:id', wrap(async (req, res) => {
  const patch = orderPatchSchema.parse(req.body);
  const cur = must(await db.from('orders').select('status').eq('id', req.params.id).maybeSingle());
  if (!cur) throw new HttpError(404, 'Commande introuvable');
  if (patch.status) {
    const ok = {
      awaiting_payment: ['cancelled'], paid: ['preparing', 'cancelled', 'refunded'],
      preparing: ['shipping', 'cancelled', 'refunded'], shipping: ['delivered', 'cancelled', 'refunded'],
      delivered: ['refunded'], cancelled: [], refunded: [],
    };
    if (!ok[cur.status]?.includes(patch.status)) throw new HttpError(400, 'Changement de statut impossible');
  }
  must(await db.from('orders').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', req.params.id));
  await log('order_updated', { orderId: req.params.id, by: req.user.username, patch });
  res.json({ ok: true });
}));

admin.get('/products', wrap(async (_req, res) => res.json(must(await db.from('products').select('*').order('created_at', { ascending: false })))));
admin.post('/products', wrap(async (req, res) => res.json(must(await db.from('products').insert(productSchema.parse(req.body)).select().single()))));
admin.put('/products/:id', wrap(async (req, res) => res.json(must(await db.from('products').update(productSchema.parse(req.body)).eq('id', req.params.id).select().single()))));
admin.delete('/products/:id', wrap(async (req, res) => {
  // un produit déjà commandé est désactivé plutôt que supprimé
  const del = await db.from('products').delete().eq('id', req.params.id);
  if (del.error) { must(await db.from('products').update({ active: false }).eq('id', req.params.id)); return res.json({ ok: true, deactivated: true }); }
  res.json({ ok: true });
}));

admin.get('/zones', wrap(async (_req, res) => res.json(must(await db.from('delivery_zones').select('*').order('country')))));
admin.post('/zones', wrap(async (req, res) => res.json(must(await db.from('delivery_zones').insert(zoneSchema.parse(req.body)).select().single()))));
admin.put('/zones/:id', wrap(async (req, res) => res.json(must(await db.from('delivery_zones').update(zoneSchema.parse(req.body)).eq('id', req.params.id).select().single()))));

admin.post('/upload', wrap(async (req, res) => {
  const { contentType, dataBase64 } = req.body || {};
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[contentType];
  if (!ext || typeof dataBase64 !== 'string') throw new HttpError(400, 'Image JPEG, PNG ou WebP requise');
  const buf = Buffer.from(dataBase64, 'base64');
  if (buf.length > 4 * 1024 * 1024) throw new HttpError(413, 'Image trop lourde (4 Mo max)');
  const p = `${crypto.randomUUID()}.${ext}`;
  must(await db.storage.from('products').upload(p, buf, { contentType, upsert: false }));
  res.json({ url: db.storage.from('products').getPublicUrl(p).data.publicUrl });
}));

admin.get('/stats', wrap(async (_req, res) => {
  const orders = must(await db.from('orders').select('status, total_pi, paid_at, order_items(name, qty)').limit(5000));
  const paid = orders.filter((o) => ['paid', 'preparing', 'shipping', 'delivered'].includes(o.status));
  const byStatus = {}; orders.forEach((o) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
  const top = {}; paid.forEach((o) => o.order_items.forEach((i) => { top[i.name] = (top[i.name] || 0) + i.qty; }));
  res.json({
    revenue_pi: paid.reduce((s, o) => s + Number(o.total_pi), 0), paid_orders: paid.length, byStatus,
    top: Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty })),
  });
}));
app.use('/api/admin', admin);

// ---------- Front ----------
app.use(express.static(path.join(here, '..', 'public'), {
  index: 'index.html',
  setHeaders: (res, file) => { res.setHeader('Cache-Control', /\.(html|js|css)$/.test(file) ? 'no-cache' : 'public, max-age=604800'); },
}));
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Route inconnue')));

app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const known = err.issues.find((i) => i.message.endsWith('.'));
    return res.status(400).json({ error: known?.message || 'Veuillez remplir tous les champs obligatoires.' });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error('error:', err?.message || err);
  res.status(500).json({ error: 'Erreur serveur' });
});

const port = Number(env.PORT) || 3000;
seedZones(db).then((n) => console.log(`zones: ${n} ajoutée(s)`)).catch((e) => console.error('zones: échec', e?.message || e));
app.listen(port, () => console.log(`Boutique démarrée sur le port ${port}`));

// ---------- Service d'éveil ----------
// 1) Render (offre gratuite) endort le site après ~15 min sans visite : le serveur s'appelle lui-même
//    par son adresse publique toutes les 10 min tant qu'il est réveillé.
// 2) Supabase (offre gratuite) met le projet en pause après une semaine d'inactivité : une lecture
//    légère de la base toutes les 6 h l'en empêche.
// Limite : un site déjà endormi ne peut pas se réveiller seul. Ajoutez un moniteur externe sur /healthz
// (voir README). Désactivation : KEEPALIVE=off.
if (env.KEEPALIVE !== 'off') {
  const selfUrl = (env.KEEPALIVE_URL || env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
  if (selfUrl) {
    setInterval(() => {
      fetch(`${selfUrl}/healthz`, { signal: AbortSignal.timeout(15000) })
        .catch((e) => console.error('keepalive: appel du site échoué', e.message));
    }, 10 * 60 * 1000).unref();
  }
  const pingDb = () => db.from('categories').select('id').limit(1)
    .then(({ error }) => { if (error) console.error('keepalive: lecture base échouée', error.message); }, (e) => console.error('keepalive: base injoignable', e.message));
  setTimeout(pingDb, 30 * 1000).unref();
  setInterval(pingDb, 6 * 60 * 60 * 1000).unref();
}
