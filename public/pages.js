// Textes modèles : à adapter à votre activité et à faire relire par un juriste avant l'ouverture au public.
import { esc } from './core.js';

const contact = (c) => `<p>${c.contactEmail ? `E-mail : ${esc(c.contactEmail)}<br>` : ''}${c.contactPhone ? `Téléphone / WhatsApp : ${esc(c.contactPhone)}` : 'Coordonnées à renseigner par le promoteur (variables CONTACT_EMAIL et CONTACT_PHONE).'}</p>`;

export const PAGES = {
  livraison: { title: 'Livraison', body: `<p>La livraison est organisée par le promoteur de la boutique, à domicile, dans les zones indiquées au moment de la commande.</p>
    <ul><li>Les frais et le délai indicatif dépendent de la zone choisie ; ils sont affichés avant le paiement.</li>
    <li>La préparation commence uniquement après confirmation du paiement en Pi.</li>
    <li>Vous suivez l'état de votre commande dans « Mes commandes » (numéro de suivi et date estimée si disponibles).</li>
    <li>Un livreur peut vous appeler : renseignez un numéro joignable et un point de repère précis.</li></ul>` },
  retours: { title: 'Retours et remboursements', body: `<p>Contactez le service client dans les 7 jours suivant la livraison pour signaler un produit non conforme ou endommagé.</p>
    <ul><li>Les produits d'hygiène et de beauté ouverts ne sont ni repris ni échangés, sauf défaut.</li>
    <li>Un remboursement accepté est effectué en Pi vers votre portefeuille ; le statut de la commande passe à « Remboursée ».</li></ul>
    <p class="muted">Ces délais sont des exemples à confirmer par le promoteur.</p>` },
  faq: { title: 'Questions fréquentes', body: `<h3>Comment payer ?</h3><p>Uniquement en Pi, depuis le Pi Browser, après connexion avec votre compte Pi.</p>
    <h3>Quand ma commande est-elle confirmée ?</h3><p>Dès que le paiement est vérifié par nos serveurs auprès de Pi Network.</p>
    <h3>Mon paiement est resté en attente.</h3><p>Rouvrez la boutique dans le Pi Browser et reconnectez-vous : un paiement en suspens est repris automatiquement. Sinon, ouvrez la commande et choisissez « Payer ».</p>
    <h3>Les images sont-elles contractuelles ?</h3><p>Certaines images sont des visuels de démonstration, remplacés par les photos réelles des produits.</p>` },
  cgv: { title: 'Conditions de vente', body: `<p>Les prix sont affichés en Pi, frais de livraison en sus. La commande est ferme et définitive après confirmation du paiement.</p>
    <p>Le promoteur se réserve le droit d'annuler et de rembourser une commande en cas d'indisponibilité du produit. Le stock affiché peut évoluer jusqu'à la confirmation du paiement.</p>
    <p class="muted">Texte modèle : à compléter (identité du vendeur, droit de rétractation applicable dans votre pays, litiges) et à faire valider.</p>` },
  confidentialite: { title: 'Confidentialité', body: `<p>Nous collectons : votre nom d'utilisateur Pi, et pour livrer votre commande, votre nom, téléphone et adresse.</p>
    <ul><li>Ces données servent uniquement à traiter, livrer et suivre vos commandes.</li>
    <li>Elles ne sont accessibles qu'au promoteur et aux personnes autorisées à livrer.</li>
    <li>Nous ne demandons jamais votre phrase secrète Pi ni votre clé privée. Ne les communiquez à personne.</li></ul>
    <p>Pour demander l'accès à vos données ou leur suppression, contactez-nous.</p>` },
  contact: { title: 'Contact', body: (c) => `<p>Une question sur une commande ? Indiquez votre numéro de commande.</p>${contact(c)}
    <p class="muted">Éclat &amp; Style est une application indépendante, non affiliée à Pi Network et non approuvée par lui. Le mot « Pi » désigne ici uniquement la cryptomonnaie acceptée en paiement.</p>` },
};
