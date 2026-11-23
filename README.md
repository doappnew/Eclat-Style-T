# Éclat & Style — boutique beauté, bijoux et mode (paiement en Pi)

Application mobile-first : catalogue, panier, commande, paiement Pi vérifié côté serveur, suivi, administration.
Stack : Express (Node 22) + Supabase (Postgres, RLS, stockage photos) + Pi SDK dans le Pi Browser.

## Conformité Pi Network (ce qui a été appliqué)
- Nom, domaine et logo **sans** « Pi » ni symbole π : « Éclat & Style », monogramme « É ». Le mot « Pi » n'apparaît que pour dire que l'on paie en Pi (usage de compatibilité). Pour utiliser « Pi » dans le nom, le domaine ou les réseaux sociaux, il faut une licence de marque signée via le Developer Portal.
- Mention visible : application indépendante, non affiliée à Pi Network.
- Montant, produit et statut du paiement décidés et vérifiés par le serveur auprès de l'API Pi (jamais par le navigateur) : approbation, complétion, anti double paiement, reprise des paiements incomplets, annulations.
- Aucune phrase secrète ni clé privée demandée ou stockée. Clés uniquement en variables d'environnement.
- Photos : n'utilisez que des images dont vous avez les droits, sans logo de marque tierce ni contrefaçon (la liste de contrôle Mainnet de Pi vérifie les violations de marque).

## Mise en route
1. **Supabase** : créez un projet, ouvrez SQL Editor, exécutez `supabase/001_schema.sql` (tables, sécurité, 74 produits de démonstration).
2. **Hébergement** (ex. Render, Web Service Node) : `npm install` puis `npm start`. Variables : voir `.env.example`. `NODE_VERSION=22`. Activez Auto-Deploy.
3. **Developer Portal Pi** : enregistrez l'app en *Self Hosted* avec l'URL publique de la boutique ; copiez la clé de validation dans `PI_VALIDATION_KEY` (servie sur `/validation-key.txt`) puis vérifiez le domaine ; créez la clé API (`PI_API_KEY`) **de cette même app** ; créez le portefeuille de l'app (testnet d'abord).
4. Ouvrez la boutique **dans le Pi Browser** (le SDK n'existe pas ailleurs), connectez-vous.
5. Devenez administrateur : `update users set role = 'admin' where username = 'votre_nom_pi';`
6. Dans l'admin : zones de livraison réelles, vrais prix, vraies photos (les produits « démo » sont marqués).

## Paiement : flux
Commande créée côté serveur (prix recalculés) → `Pi.createPayment` → `/approve` (contrôle utilisateur, commande, montant) → signature dans le portefeuille → `/complete` → `finalize_paid_order` (atomique, idempotent, décrémente le stock). La commande n'est « payée » qu'à ce moment.

## Service d'éveil (offres gratuites)
- Le serveur s'appelle lui-même toutes les 10 min (`/healthz`) pour que Render ne l'endorme pas, et lit la base toutes les 6 h pour que Supabase ne se mette pas en pause. Voir `server/index.js`.
- Un site déjà endormi ne peut pas se réveiller seul : ajoutez un moniteur externe gratuit (UptimeRobot ou cron-job.org) qui appelle `https://VOTRE-SITE.onrender.com/healthz` toutes les 5 minutes.
- Le site affiche « La boutique se réveille… » et réessaie si le serveur met du temps à répondre.
- Désactivation : `KEEPALIVE=off`.

## Avant la production
Prix réels · juriste pour CGV/confidentialité (`public/pages.js` = modèles) · changer toute clé collée dans un chat · Mainnet : KYC, URL vérifiée, portefeuille distinct · remboursement : effectué manuellement depuis le portefeuille de l'app puis statut « Remboursée ».

Tests : `npm test`.

## Plafond de test
`PI_MAX_PAYMENT=2` : le serveur refuse toute commande dont le total dépasse 2 Pi (retirer cette variable pour la production).
