# Sécurité

## Clé API Firebase

Le site utilise une clé API Firebase **web**, lue depuis `VITE_FIREBASE_API_KEY`
(fichier `.env`, non versionné) et injectée au build. Cette clé est publique par
conception : elle est présente dans le HTML et le JavaScript envoyés au
navigateur. Elle ne doit **jamais** être écrite en dur dans le dépôt.

### Pourquoi la restreindre

Une clé Firebase sans restriction permet à n'importe qui de consommer le quota
Firestore/Auth du projet (facturation, déni de service) et d'appeler les API
Firebase autorisées depuis n'importe quel domaine. Les règles Firestore restent
la seule protection des données, en particulier en écriture.

### Restriction (Google Cloud Console)

1. Ouvrir [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials?project=webimmo-6189a).
2. Éditer la clé utilisée par le site (celle de `VITE_FIREBASE_API_KEY`).
3. **Application restrictions** → *HTTP referrers* :
   - `https://elisebuilimmobilierguadeloupe.com/*`
   - `https://www.elisebuilimmobilierguadeloupe.com/*`
   - `https://webimmo-6189a.web.app/*`
   - `https://webimmo-6189a.firebaseapp.com/*`
   - `http://localhost:*/*` (développement local)
4. **API restrictions** → limiter aux API réellement utilisées :
   - Cloud Firestore API
   - Identity Toolkit API
   - Token Service API
   - Firebase Installations API
   - Firebase Storage API (le panneau d'administration téléverse des images)
5. Enregistrer, puis vérifier la lecture des annonces et la connexion à `/Gestion`.

### Rotation (obligatoire après une exposition)

La clé a déjà été publiée dans l'historique Git : la retirer du code ne
l'invalide pas. Toute personne ayant cloné le dépôt peut encore l'utiliser.

1. Créer une **nouvelle** clé avec les restrictions ci-dessus.
2. Mettre à jour `VITE_FIREBASE_API_KEY` dans `.env`.
3. Reconstruire et redéployer : `npm run build && firebase deploy`.
4. Vérifier le site, puis **supprimer l'ancienne clé** dans la console.
5. Fermer l'alerte GitHub (Secret scanning) une fois l'ancienne clé supprimée.

> Ne pas réécrire l'historique Git (`git filter-repo`) : la rotation est la
> seule mesure qui rend la clé exposée inutilisable.

### Règles Firestore

Les règles Firestore ne sont pas versionnées dans ce dépôt. Vérifier dans la
console que les écritures exigent une authentification (le panneau `/Gestion`
utilise Firebase Auth) et que seules les collections publiques (`houses`,
`settings`) sont lisibles sans compte.

## App Check (anti-abus)

App Check vérifie que les requêtes viennent de l'application déployée, et non
d'un script qui aurait copié la clé API.

1. Firebase Console → App Check → Applications → ajouter l'application web.
2. Choisir **reCAPTCHA v3** et autoriser les domaines du site
   (`elisebuilimmobilierguadeloupe.com`, `www.elisebuilimmobilierguadeloupe.com`,
   `webimmo-6189a.web.app`, `webimmo-6189a.firebaseapp.com`, `localhost`).
3. Copier la **clé de site** reCAPTCHA dans `.env` :
   `VITE_RECAPTCHA_SITE_KEY=...`
4. Reconstruire et déployer (`npm run build && firebase deploy`).
5. Laisser App Check en **surveillance** quelques jours, vérifier les métriques,
   puis activer l'application pour **Cloud Firestore**.

En local, laisser `VITE_RECAPTCHA_SITE_KEY` vide désactive App Check (le site
fonctionne normalement). Sinon, utiliser un jeton de débogage :
`FIREBASE_APPCHECK_DEBUG_TOKEN=true`.

Quand App Check est actif, le préchargement Firestore inline d'`index.html` est
désactivé : le jeton n'existe qu'après le chargement du SDK. La photo locale est
préchargée à la place, puis React charge le vrai hero.

## Quotas et alertes budget

1. Google Cloud Console → **Billing → Budgets & alerts** : créer un budget
   (par exemple 5 €/mois) avec des alertes à 50 %, 90 % et 100 %.
2. **Firestore → Quotas** : vérifier les limites de lectures/écritures et les
   ajuster si nécessaire.
3. Surveiller les métriques Firebase (Firestore, Auth, Functions) après la
   mise en production.
4. En cas d'abus : désactiver la clé compromise, puis en créer une nouvelle.

Les fonctions publiques (`listings`, `renderHouseMeta`) sont limitées à
`maxInstances: 10` pour borner le coût en cas de pic.

## API publique des annonces

`/api/listings` est servie par la Cloud Function `listings` (Admin SDK). Elle ne
contient aucune clé, est en lecture seule et expose uniquement les annonces
publiques (les biens `en attente` sont exclus). Elle est mise en cache 5 minutes
et limitée en instances.

Cet endpoint n'est **pas** protégé par App Check : il est destiné aux agents
externes du catalogue ARD, qui ne peuvent pas obtenir de jeton. En cas d'abus,
restreindre les quotas ou ajouter un rate-limit en amont (Cloud Armor, API
Gateway).
