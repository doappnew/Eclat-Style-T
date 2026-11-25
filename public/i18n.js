// Langue de l'interface : français (par défaut) ou anglais. Choix mémorisé sur l'appareil.
// Les textes de l'application sont écrits en français ; en anglais ils sont traduits à l'affichage.
export const LANG = (() => {
  try { const s = localStorage.getItem('lang'); if (s === 'fr' || s === 'en') return s; } catch { /* ignore */ }
  return (navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en';
})();
export const LOCALE = LANG === 'en' ? 'en-US' : 'fr-FR';
export function setLang(l) { try { localStorage.setItem('lang', l); } catch { /* ignore */ } location.reload(); }

const D = {
  'Bienvenue chez Éclat & Style': 'Welcome to Éclat & Style',
  'Révélez votre éclat, affirmez votre style': 'Reveal your glow, assert your style',
  'Connexion Pi': 'Pi sign-in', 'Panier': 'Cart', 'Accueil': 'Home', 'Favoris': 'Favourites', 'Compte': 'Account', 'Catalogue': 'Catalogue',
  'Livraison': 'Delivery', 'Retours': 'Returns', 'FAQ': 'FAQ', "Conditions d'utilisation": 'Terms of use', 'Conditions de vente': 'Terms of sale',
  'Confidentialité': 'Privacy', 'Contact': 'Contact',
  'Paiement en Pi, compatible Pi Network. Application indépendante, non affiliée à Pi Network ni approuvée par lui.': 'Payment in Pi, compatible with Pi Network. Independent application, not affiliated with or approved by Pi Network.',
  'Révélez votre': 'Reveal your', ' et la ': ' and the ', 'Révélez votre éclat': 'Reveal your glow', 'éclat': 'glow',
  'Beauté, bijoux et mode, payés en Pi.': 'Beauty, jewellery and fashion, paid in Pi.',
  'Beauté, bijoux et mode, payés en Pi. Connectez-vous pour entrer dans la boutique.': 'Beauty, jewellery and fashion, paid in Pi. Sign in to enter the shop.',
  'Se connecter avec Pi': 'Sign in with Pi', 'Voir la boutique': 'View the shop', 'Découvrir la boutique': 'Discover the shop',
  'Catégories': 'Categories', 'Nouveautés': 'New arrivals', 'Tout voir': 'See all', 'Nos produits': 'Our products',
  'Cosmétiques & soins': 'Cosmetics & skincare', 'Maquillage': 'Make-up', 'Parfums': 'Perfumes', 'Beauté homme': "Men's beauty",
  'Bijoux & joaillerie': 'Jewellery', 'Sacs': 'Bags', 'Chaussures': 'Shoes', 'Accessoires de mode': 'Fashion accessories', 'Tenues & costumes': 'Outfits & suits',
  'Épuisé': 'Sold out', 'Promo': 'Sale', 'Nouveau': 'New', 'Choisir': 'Choose', 'Ajouter': 'Add', 'Acheter': 'Buy',
  'Rechercher par nom ou type de produit…': 'Search by name or product type…', 'Tout': 'All', 'Prix croissant': 'Price: low to high', 'Prix décroissant': 'Price: high to low',
  'En stock': 'In stock', 'Aucun produit trouvé.': 'No product found.', 'Voir plus': 'See more', 'Tri': 'Sort',
  'Produit introuvable.': 'Product not found.', '← Catalogue': '← Catalogue', ' · image de démonstration': ' · demonstration image',
  'Quantité': 'Quantity', 'Ajouter au panier': 'Add to cart', 'Payer maintenant': 'Pay now', '♥ Retirer des favoris': '♥ Remove from favourites', '♡ Ajouter aux favoris': '♡ Add to favourites', 'Favori': 'Favourite',
  'Mon panier': 'My cart', 'Votre panier est vide.': 'Your cart is empty.', 'Voir la boutique ': 'View the shop', 'Retirer': 'Remove', 'Sous-total': 'Subtotal',
  "Les frais de livraison sont calculés à l'étape suivante selon votre zone.": 'Delivery fees are calculated at the next step, depending on your zone.',
  'Commander': 'Checkout', 'Commande': 'Order',
  'Informations de livraison': 'Delivery information', 'Nom et prénom': 'Full name', 'Téléphone': 'Phone', 'Zone de livraison (pays — ville)': 'Delivery zone (country — city)',
  'Commune': 'District', 'Quartier': 'Neighbourhood', 'Adresse précise ou point de repère': 'Exact address or landmark',
  'Instructions pour le livreur (facultatif)': 'Instructions for the courier (optional)', "Nom du destinataire, s'il est différent (facultatif)": 'Recipient name, if different (optional)',
  'Total à payer': 'Total to pay', 'Le montant définitif est recalculé et confirmé par le serveur avant le paiement.': 'The final amount is recalculated and confirmed by the server before payment.',
  'Paiement exclusivement en Pi, dans le Pi Browser.': 'Payment exclusively in Pi, in the Pi Browser.',
  'conditions d\'utilisation': 'terms of use', 'politique de confidentialité': 'privacy policy',
  'Payer en Pi': 'Pay with Pi', 'Se connecter et payer en Pi': 'Sign in and pay with Pi',
  'Mes commandes': 'My orders', 'Aucune commande pour le moment.': 'No orders yet.', 'Connectez-vous pour voir vos commandes.': 'Sign in to see your orders.',
  'Connectez-vous pour voir cette commande.': 'Sign in to see this order.', 'Connectez-vous pour retrouver vos favoris.': 'Sign in to find your favourites.',
  'Connectez-vous avec votre compte Pi pour commander et suivre vos achats.': 'Sign in with your Pi account to order and track your purchases.',
  'Connexion': 'Sign-in',
  'En attente de paiement': 'Awaiting payment', 'Payée et confirmée': 'Paid and confirmed', 'En préparation': 'Being prepared', 'En cours de livraison': 'Out for delivery',
  'Livrée': 'Delivered', 'Annulée': 'Cancelled', 'Remboursée': 'Refunded',
  'Paiement réussi.': 'Payment successful.', 'Votre commande est confirmée.': 'Your order is confirmed.', "Le paiement n'a pas été confirmé.": 'The payment has not been confirmed.',
  'Articles': 'Items', 'Total': 'Total', 'Contacter le service client': 'Contact customer service',
  'Favoris ': 'Favourites', 'Aucun favori pour le moment.': 'No favourites yet.',
  'La connexion Pi fonctionne uniquement dans le Pi Browser.': 'Pi sign-in only works in the Pi Browser.',
  'Diagnostic': 'Diagnostic', 'Mon compte': 'My account', 'Mes favoris': 'My favourites', 'Administration': 'Administration', 'Se déconnecter': 'Sign out',
  'Test Testnet des pionniers': 'Pioneers Testnet test', '1 · Connexion': '1 · Sign-in', '2 · Paiement de test': '2 · Test payment', '3 · Envoi reçu': '3 · Transfer received',
  'Compte validé, merci !': 'Account validated, thank you!', 'Recevoir mon envoi de test (Testnet)': 'Receive my test transfer (Testnet)',
  "Test pas encore activé par l'administrateur.": 'Test not yet enabled by the administrator.',
  'Page introuvable.': 'Page not found.', 'Accès refusé': 'Access denied', 'Cet espace est réservé aux administrateurs.': 'This area is reserved for administrators.',
  'Chargement…': 'Loading…', 'La boutique se réveille, quelques secondes…': 'The shop is waking up, a few seconds…',
  'Ajouté au panier': 'Added to cart', 'Connectez-vous pour utiliser les favoris': 'Sign in to use favourites', 'Connexion en cours…': 'Signing in…',
  'Connexion impossible. Réessayez.': 'Sign-in failed. Please try again.', 'Envoi impossible': 'Transfer failed',
  'Commande enregistrée, en attente de paiement': 'Order saved, awaiting payment',
  'Pi ne répond pas. Vérifiez que l\'application est ouverte dans le Pi Browser, enregistrée et validée dans le Portail développeur, puis réessayez.': 'Pi is not responding. Check that the app is open in the Pi Browser, registered and validated in the Developer Portal, then try again.',
  'Ouvrez cette boutique dans le Pi Browser pour vous connecter et payer en Pi.': 'Open this shop in the Pi Browser to sign in and pay with Pi.',
  'Paiement annulé. Votre commande reste en attente de paiement.': 'Payment cancelled. Your order remains awaiting payment.',
  'Le paiement Pi a échoué.': 'The Pi payment failed.', 'Un paiement en attente a été finalisé.': 'A pending payment has been completed.',
  "Le paiement Pi n'est pas encore activé pour cette application. Vérifiez le portefeuille de l'application dans le Portail développeur.": 'Pi payment is not yet enabled for this application. Check the app wallet in the Developer Portal.',
  'Une erreur est survenue. Réessayez.': 'An error occurred. Please try again.', 'Connexion requise': 'Sign-in required',
  'Connexion Pi refusée. Ouvrez l\'application dans le Pi Browser.': 'Pi sign-in refused. Open the app in the Pi Browser.',
  'Indiquez le nom du destinataire.': 'Enter the recipient name.', 'Téléphone invalide.': 'Invalid phone number.', 'Indiquez la commune.': 'Enter the district.',
  'Indiquez le quartier.': 'Enter the neighbourhood.', 'Indiquez une adresse de livraison (3 caractères minimum).': 'Enter a delivery address (3 characters minimum).',
  'Choisissez une zone de livraison.': 'Choose a delivery zone.', 'Votre panier est vide.': 'Your cart is empty.', 'Veuillez remplir tous les champs obligatoires.': 'Please fill in all required fields.',
  'Quantité invalide.': 'Invalid quantity.',
  // zones
  'Bénin': 'Benin', "Côte d'Ivoire": 'Ivory Coast', 'Sénégal': 'Senegal', 'Cameroun': 'Cameroon', 'RD Congo': 'DR Congo', 'Maroc': 'Morocco',
  "Autres pays d'Afrique": 'Other African countries', 'États-Unis': 'United States', 'France': 'France', 'Belgique': 'Belgium', 'Royaume-Uni': 'United Kingdom',
  'Allemagne': 'Germany', 'Espagne': 'Spain', 'Italie': 'Italy', 'Suisse': 'Switzerland', "Autres pays d'Europe": 'Other European countries',
  'Autres villes': 'Other cities', 'Toutes villes': 'All cities',
};
const RX = [
  [/^(\d+) produits?$/, (m) => `${m[1]} product${m[1] > 1 ? 's' : ''}`],
  [/^Voir tout \((\d+)\)$/, (m) => `See all (${m[1]})`],
  [/^Plus que (\d+) en stock$/, (m) => `Only ${m[1]} left in stock`],
  [/^Payer (.+ Pi)$/, (m) => `Pay ${m[1]}`],
  [/^Bonjour (.+)$/, (m) => `Hello ${m[1]}`],
  [/^Connexion réussie\. Bienvenue (.+)$/, (m) => `Signed in. Welcome ${m[1]}`],
  [/^Envoi de test reçu : (.+)$/, (m) => `Test transfer received: ${m[1]}`],
  [/^Réseau Pi Testnet : aucun Pi réel\. Pionniers validés : (.+)$/, (m) => `Pi Testnet network: no real Pi. Validated pioneers: ${m[1]}`],
  [/^Phase de test : montant maximal par commande (.+) Pi\.$/, (m) => `Test phase: maximum amount per order ${m[1]} Pi.`],
  [/^Délai indicatif : (.+)$/, (m) => `Estimated time: ${m[1]}`],
  [/^Livraison estimée : (.+)$/, (m) => `Estimated delivery: ${m[1]}`],
  [/^Suivi : (.+)$/, (m) => `Tracking: ${m[1]}`],
  [/^Connexion Pi impossible\. Message de Pi : (.+)$/, (m) => `Pi sign-in failed. Message from Pi: ${m[1]}`],
  [/^(\d+) à (\d+) (jours|h)$/, (m) => `${m[1]} to ${m[2]} ${m[3] === 'jours' ? 'days' : 'h'}`],
  [/^En continuant, vous acceptez les (.*)$/, () => 'By continuing, you accept the'],
];
const tr = (s) => {
  const k = s.trim(); if (!k) return s;
  let out = D[k];
  if (out == null) for (const [re, f] of RX) { const m = k.match(re); if (m) { out = f(m); break; } }
  if (out == null) return s;
  const lead = s.match(/^\s*/)[0]; const tail = s.match(/\s*$/)[0];
  return lead + out + tail;
};
export const t = (s) => (LANG === 'en' ? tr(String(s ?? '')) : s);

const ATTRS = ['placeholder', 'aria-label', 'label', 'title', 'alt'];
function walk(node) {
  if (node.nodeType === 3) { const v = tr(node.nodeValue); if (v !== node.nodeValue) node.nodeValue = v; return; }
  if (node.nodeType !== 1 || ['SCRIPT', 'STYLE'].includes(node.tagName)) return;
  for (const a of ATTRS) if (node.hasAttribute(a)) { const v = tr(node.getAttribute(a)); if (v !== node.getAttribute(a)) node.setAttribute(a, v); }
  node.childNodes.forEach(walk);
}
if (LANG === 'en') {
  document.documentElement.lang = 'en';
  const start = () => {
    walk(document.body);
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(walk))).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
}
