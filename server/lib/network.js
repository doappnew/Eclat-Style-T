// Réseau Pi visé par cette instance : testnet (défaut) ou mainnet, selon PI_NETWORK. Logique pure, testée sans base de données.
export const NETWORK_NAMES = { testnet: 'Pi Testnet', mainnet: 'Pi Network' };

export function networkOf(env) {
  const v = String(env.PI_NETWORK || 'testnet').trim().toLowerCase();
  if (v !== 'testnet' && v !== 'mainnet') throw new Error('PI_NETWORK doit valoir testnet ou mainnet');
  return v;
}

// Au démarrage : en mainnet, la clé API et la clé de validation du domaine sont obligatoires.
export function startupProblems(env) {
  const problems = [];
  if (networkOf(env) === 'mainnet') {
    if (!env.PI_API_KEY) problems.push('PI_API_KEY manquante');
    if (!env.PI_VALIDATION_KEY) problems.push('PI_VALIDATION_KEY manquante');
  }
  return problems;
}

// L'envoi de test (A2U) n'existe jamais en mainnet, même avec TESTNET_PAYOUT=1.
export const payoutOpen = (env) => networkOf(env) === 'testnet' && env.TESTNET_PAYOUT === '1' && !!env.PI_WALLET_SEED && !!env.PI_API_KEY;

// Le paiement renvoyé par l'API Pi doit appartenir au bon réseau. En mainnet le champ est exigé ;
// en testnet, un champ absent est toléré (une valeur différente est toujours refusée).
export function checkPaymentNetwork(payment, network) {
  const expected = NETWORK_NAMES[network];
  if (payment?.network == null) return network === 'mainnet' ? { ok: false, reason: 'network_missing' } : { ok: true };
  return payment.network === expected ? { ok: true } : { ok: false, reason: 'network_mismatch' };
}

export const BRAND_BLACKLIST = ['Versace', 'Chanel', 'Dior', 'Gucci', 'Louis Vuitton', 'Nike', 'Adidas'];
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function findBlacklistedBrands(names) {
  const hits = [];
  for (const n of names) for (const b of BRAND_BLACKLIST) if (new RegExp(`(^|[^a-z])${fold(b)}([^a-z]|$)`).test(fold(n))) hits.push({ name: n, brand: b });
  return hits;
}

// Liste de contrôle Mainnet : chaque ligne vaut { label, ok }. Ne dit jamais que Pi a approuvé l'application.
export function buildChecklist({ env, demoActive, zones, productNames, pagesOk }) {
  const brands = findBlacklistedBrands(productNames);
  return [
    { id: 'network', label: 'PI_NETWORK = mainnet', ok: networkOf(env) === 'mainnet' },
    { id: 'keys', label: 'Clé API Pi et clé de validation du domaine définies', ok: !!env.PI_API_KEY && !!env.PI_VALIDATION_KEY },
    { id: 'demo', label: 'Aucun produit « démo » actif', ok: demoActive === 0, detail: demoActive ? `${demoActive} produit(s) démo actif(s)` : '' },
    { id: 'zones', label: 'Au moins une zone de livraison active avec des frais réels', ok: zones.some((z) => z.active !== false && Number(z.fee_pi) > 0) },
    { id: 'contact', label: 'CONTACT_EMAIL et CONTACT_PHONE renseignés', ok: !!env.CONTACT_EMAIL && !!env.CONTACT_PHONE },
    { id: 'brands', label: 'Aucun nom de produit contenant une marque de la liste noire', ok: brands.length === 0, detail: brands.map((b) => `${b.name} (${b.brand})`).join(', ') },
    { id: 'pages', label: 'Pages légales présentes', ok: !!pagesOk },
  ];
}

// Plafond par commande : s'applique seulement si PI_MAX_PAYMENT est défini (> 0), sur les deux réseaux.
export const paymentCap = (env) => { const n = Number(env.PI_MAX_PAYMENT); return Number.isFinite(n) && n > 0 ? n : 0; };
