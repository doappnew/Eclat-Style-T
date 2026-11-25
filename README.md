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

## Dépannage connexion Pi
**Symptôme :** « Pi : Authentication failed » dans le Pi Browser, avant même que le serveur soit appelé.

**Cause :** les en-têtes de sécurité du serveur (helmet, surtout la politique CSP et les règles d'ouverture/cadre) empêchaient le SDK Pi de s'exécuter dans le Pi Browser. Ils sont donc désactivés par défaut : la variable `STRICT_HEADERS` pilote leur réactivation progressive (vide = helmet sans CSP, `1` = CSP complète, `0` = aucun en-tête helmet).

**À savoir :**
- La connexion demande uniquement le nom d'utilisateur (`username`). La permission `payments` n'est demandée qu'au moment de payer.
- Ouvrir l'application dans le Pi Browser uniquement ; dans Chrome, le SDK Pi n'existe pas.
- En cas de nouvel échec, regarder les journaux Render filtrés sur `auth:` (code de réponse de l'API Pi, sans aucun secret).
- Pour tester la CSP complète : mettre `STRICT_HEADERS=1`, tester la connexion ; si elle échoue, remettre la valeur vide.

## Réseau (PI_NETWORK)
`PI_NETWORK=testnet` (défaut) ou `mainnet`. Le même code sert les deux. En mainnet : le serveur refuse de démarrer sans `PI_API_KEY` et `PI_VALIDATION_KEY`, la route d'envoi de test est fermée (404) même avec `TESTNET_PAYOUT=1`, la section « Test Testnet » disparaît, et chaque paiement est refusé si `payment.network` ne correspond pas au réseau configuré (« Pi Network » pour le Mainnet, « Pi Testnet » pour le Testnet).

## Passage au Mainnet
Le même code sert les deux réseaux ; seules les variables d'environnement changent. Faites le passage dans un **service Render distinct** (ne touchez pas au service Testnet qui fonctionne).
1. **Portail développeur Pi** : créez une application **Mainnet distincte** (différente de l'application Testnet). Enregistrez-y une **nouvelle adresse** (nouveau domaine Render) et faites-la vérifier : la clé de validation s'affiche, c'est elle qui va dans `PI_VALIDATION_KEY` (servie sur `/validation-key.txt`).
2. **Nouvelle clé API** de cette application Mainnet, et **nouveau portefeuille de l'application** (jamais celui du Testnet). Ne communiquez jamais la phrase secrète du portefeuille.
3. **Base de données** : projet Supabase distinct, schéma `supabase/001_schema.sql`.
4. **Variables Render à changer** :
   - `PI_NETWORK=mainnet`
   - `PI_API_KEY` (clé de l'application Mainnet)
   - `PI_VALIDATION_KEY` (clé de validation du nouveau domaine)
   - `PI_WALLET_SEED` : à ne définir que si des envois depuis l'application sont nécessaires ; en Mainnet l'envoi de test reste de toute façon fermé (404), même avec `TESTNET_PAYOUT=1`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_SECRET` (nouveaux), `CONTACT_EMAIL`, `CONTACT_PHONE`
5. **Retirez `PI_MAX_PAYMENT`** quand vous êtes prêt à ouvrir sans plafond (le code le garde : il ne s'applique que s'il est défini).
6. Le serveur **refuse de démarrer** en Mainnet sans `PI_API_KEY` ou `PI_VALIDATION_KEY`, ou s'il reste un produit « démo » actif. Chaque paiement est refusé si son réseau (`payment.network`) ne correspond pas à `PI_NETWORK`.
7. Ouvrez Administration, onglet **Mainnet** : la liste de contrôle (calculée côté serveur) doit être entièrement cochée. Elle ne signifie pas que Pi a approuvé l'application : cette approbation se vérifie dans le Portail développeur.
