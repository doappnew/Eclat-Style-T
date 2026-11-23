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
  confidentialite: { title: 'Politique de confidentialité', body: (c) => `<p class="muted">Dernière mise à jour : novembre 2026.</p>
    <p>Cette politique explique quelles données personnelles Éclat &amp; Style collecte, pourquoi, avec qui elles sont partagées et quels sont vos droits.</p>
    <h3>1. Données collectées</h3>
    <ul><li><b>Compte Pi :</b> votre nom d'utilisateur Pi et un identifiant propre à l'application, transmis par Pi Network lorsque vous vous connectez.</li>
    <li><b>Commande et livraison :</b> nom du destinataire, téléphone, commune, quartier, adresse ou point de repère, instructions pour le livreur.</li>
    <li><b>Paiement :</b> identifiant du paiement Pi et de la transaction, montant et date. Nous n'avons jamais accès à votre portefeuille.</li>
    <li><b>Usage :</b> favoris, panier et jeton de session, conservés sur votre appareil pour faire fonctionner la boutique. Journaux techniques de sécurité (sans mot de passe ni clé).</li></ul>
    <h3>2. Pourquoi nous les utilisons</h3>
    <ul><li>Vous connecter, traiter et vérifier vos paiements en Pi.</li><li>Préparer, livrer et suivre vos commandes, et gérer retours et remboursements.</li>
    <li>Sécuriser l'application et prévenir la fraude.</li><li>Respecter nos obligations légales et comptables.</li></ul>
    <p>Nous ne vendons pas vos données et ne les utilisons pas pour de la publicité ciblée.</p>
    <h3>3. Avec qui elles sont partagées</h3>
    <ul><li><b>Pi Network :</b> pour authentifier votre compte et traiter les paiements, selon ses propres règles de confidentialité.</li>
    <li><b>Prestataires techniques :</b> hébergement de l'application et de la base de données, uniquement pour faire fonctionner le service.</li>
    <li><b>Livreurs :</b> nom, téléphone et adresse nécessaires à la livraison de votre commande.</li>
    <li><b>Autorités :</b> si la loi l'exige.</li></ul>
    <h3>4. Durée de conservation</h3>
    <p>Les données de commande sont conservées le temps nécessaire au suivi, aux réclamations et aux obligations comptables, puis supprimées ou anonymisées. Vous pouvez effacer le panier et la session en vous déconnectant.</p>
    <h3>5. Sécurité</h3>
    <p>Les échanges sont chiffrés, les montants sont calculés et vérifiés par nos serveurs, l'accès aux données est limité aux personnes autorisées. <b>Nous ne demandons jamais votre phrase secrète Pi ni votre clé privée : ne les communiquez à personne.</b></p>
    <h3>6. Vos droits</h3>
    <p>Vous pouvez demander l'accès à vos données, leur correction ou leur suppression, et vous opposer à certains traitements, en nous contactant ci-dessous.</p>
    <h3>7. Mineurs</h3><p>La boutique s'adresse aux personnes majeures ou disposant de l'accord d'un représentant légal.</p>
    <h3>8. Modifications</h3><p>Cette politique peut évoluer ; la date de mise à jour figure en haut de page.</p>
    <h3>9. Contact</h3>${contact(c)}
    <p class="muted">Texte modèle à adapter à votre activité, à la loi applicable dans votre pays et à faire relire par un juriste.</p>` },
  conditions: { title: "Conditions d'utilisation", body: (c) => `<p class="muted">Dernière mise à jour : novembre 2026.</p>
    <p>En utilisant Éclat &amp; Style, vous acceptez les présentes conditions. Si vous ne les acceptez pas, n'utilisez pas l'application.</p>
    <h3>1. Le service</h3><p>Éclat &amp; Style est une boutique en ligne de cosmétiques, parfums, bijoux, sacs, chaussures et accessoires de mode. Le paiement s'effectue exclusivement en Pi, dans le Pi Browser. La livraison est organisée par le promoteur de la boutique.</p>
    <h3>2. Compte</h3><p>Vous vous connectez avec votre compte Pi. Vous êtes responsable de l'usage de votre compte et de la sécurité de votre appareil. Nous ne vous demanderons jamais votre phrase secrète Pi.</p>
    <h3>3. Commandes et prix</h3><ul><li>Les prix sont affichés en Pi, frais de livraison en sus ; le montant exact est calculé par nos serveurs et affiché avant le paiement.</li>
    <li>La commande est confirmée seulement après vérification du paiement.</li><li>Nous pouvons annuler et rembourser une commande en cas d'indisponibilité du produit.</li></ul>
    <h3>4. Phase de test</h3><p>Pendant la phase de test, les montants peuvent être limités par commande et les produits et visuels peuvent être des exemples de démonstration. Les paiements de test n'ont aucune valeur marchande.</p>
    <h3>5. Livraison, retours et remboursements</h3><p>Voir les pages « Livraison » et « Retours ». Un remboursement accepté est effectué en Pi.</p>
    <h3>6. Utilisation acceptable</h3><p>Il est interdit de tenter de contourner la sécurité, de fournir de fausses informations, d'utiliser l'application pour fraude ou blanchiment, ou de perturber le service.</p>
    <h3>7. Propriété intellectuelle</h3><p>Les contenus de la boutique (textes, logo, mise en page) sont protégés. Les noms de marques cités appartiennent à leurs propriétaires et sont utilisés pour désigner les produits vendus.</p>
    <h3>8. Indépendance vis-à-vis de Pi Network</h3><p>Éclat &amp; Style est une application indépendante, non affiliée à Pi Network et non approuvée par lui. Le mot « Pi » désigne uniquement la cryptomonnaie acceptée en paiement.</p>
    <h3>9. Responsabilité</h3><p>Nous mettons tout en œuvre pour un service fiable, sans garantie d'absence d'interruption. Notre responsabilité est limitée dans la mesure permise par la loi ; elle ne couvre pas les incidents propres au réseau Pi ou au Pi Browser.</p>
    <h3>10. Modification et droit applicable</h3><p>Nous pouvons modifier ces conditions ; la date de mise à jour figure en haut. Le droit applicable et le tribunal compétent sont ceux du pays du promoteur (à préciser).</p>
    <h3>11. Contact</h3>${contact(c)}
    <p class="muted">Texte modèle à adapter et à faire relire par un juriste avant l'ouverture au public.</p>` },
  contact: { title: 'Contact', body: (c) => `<p>Une question sur une commande ? Indiquez votre numéro de commande.</p>${contact(c)}
    <p class="muted">Éclat &amp; Style est une application indépendante, non affiliée à Pi Network et non approuvée par lui. Le mot « Pi » désigne ici uniquement la cryptomonnaie acceptée en paiement.</p>` },
};
