# Statistiques d'audience — installation et exploitation

Le site dispose d'une mesure d'audience **first-party intégrée** : collecte anonyme via la Cloud Function `track`, stockage Firestore et tableau de bord simplifié dans `/Gestion` → onglet **Statistiques**, avec une section **« Statistiques avancées »** repliable.

Google Analytics n'est pas activé et n'apparaît pas dans le tableau de bord. Aucune donnée n'est envoyée à Google.

Aucune donnée n'est collectée avant le déploiement : l'historique commence à la mise en ligne.

---

## 1. Ce qui est mesuré

| Catégorie | Détail |
| --- | --- |
| Trafic | Pages vues, visiteurs/jour, visites, provenance (accès direct, Google, réseaux sociaux…) |
| Parcours | Pages les plus consultées, fiches biens consultées, clics sur les fiches, recherches et filtres |
| Conversions | Formulaires commencés / remplis, emails envoyés / échoués, clics WhatsApp, téléphone, email, partages |
| Provenance | Région approximative déduite du fuseau horaire |
| Engagement | Temps passé par page, part de page lue, durée moyenne des visites |
| Avancé (repliable) | Appareil, système, navigateur, langue, sites référents, actions enregistrées, visites récentes, dernières actions |

**Non mesuré volontairement** : adresse IP, nom, prénom, email, téléphone, contenu des formulaires, données de santé, etc. Les événements de formulaire ne contiennent que le type de formulaire et le statut.

---

## 2. Confidentialité (RGPD / CNIL)

La mesure est conçue pour rester dans le cadre d'une **mesure d'audience anonyme** :

- pas d'adresse IP stockée ni transmise à un tiers ;
- identifiants visiteur/session aléatoires, **hachés** avant écriture côté serveur, avec renouvellement de l'identifiant visiteur après 13 mois ;
- aucun profilage publicitaire, aucun recoupement inter-sites ;
- événements bruts, soumissions et identifiants de session/visiteur conservés **90 jours** (TTL Firestore) ;
- agrégats quotidiens anonymes conservés **sans limite par défaut** pour les tendances long terme (une politique de rétention à 25 mois peut être ajoutée) ;
- lien **« Refuser la mesure d'audience »** dans le pied de page ;
- si l'utilisateur refuse, plus aucun événement n'est envoyé.

> À faire valider par votre conseil juridique : l'exemption de consentement pour la mesure d'audience dépend des conditions CNIL (finalité limitée, pas de partage, pas de suivi inter-sites, information claire, droit d'opposition). La page de confidentialité du site doit mentionner cette mesure.

---

## 3. Déploiement

### 3.1 Variables côté site (`.env`)

```bash
# Laisser vide en production : /api/track et /api/analytics sont servis par
# Firebase Hosting sur la même origine.
VITE_ANALYTICS_URL=
VITE_ANALYTICS_API_URL=

# API des demandes (optionnel en local).
# En production, laisser vide : le site utilise /api/leads.
VITE_LEADS_URL=
```

### 3.2 Variables des Cloud Functions

À définir dans `functions/.env` (ou dans la console Google Cloud / Firebase) :

```bash
# Recommandé : sel utilisé pour hacher les identifiants visiteurs/sessions.
# Changer le sel invalide les rapprochements mais ne casse pas les compteurs.
ANALYTICS_HASH_SALT=une-valeur-longue-et-aleatoire

# Optionnel : restreint l'API du tableau de bord à ces emails administrateurs.
# Sans cette variable, tout utilisateur Firebase Auth connecté peut lire les stats.
ADMIN_EMAILS=elise@exemple.com

# Recommandé : sel dédié au hachage des jetons de mise à jour des demandes.
LEADS_HASH_SALT=une-autre-valeur-longue-et-aleatoire
```

### 3.3 Déploiement

```bash
npm --prefix functions run build
firebase deploy --only functions,hosting
```

Les rewrites `/api/track` et `/api/analytics` sont déjà déclarés dans `firebase.json`.

### 3.4 Règles Firestore

Les collections analytics et les demandes sont lues et écrites **uniquement par le SDK Admin** des Cloud Functions. Voici un fichier complet qui remplace le bloc global `match /{document=**}` :

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Collections publiques du site (lecture seule côté visiteur)
    match /houses/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /settings/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Données privées : aucun accès client
    match /leads/{document} {
      allow read, write: if false;
    }
    match /analytics_daily/{document} {
      allow read, write: if false;
    }
    match /analytics_events/{document} {
      allow read, write: if false;
    }
    match /analytics_submissions/{document} {
      allow read, write: if false;
    }
    match /analytics_session_days/{document} {
      allow read, write: if false;
    }
    match /analytics_visitor_days/{document} {
      allow read, write: if false;
    }
  }
}
```

> Le SDK Admin contourne les règles : le collecteur, l'API des demandes et le tableau de bord continuent de fonctionner.
> **Attention** : ces règles vont dans **Firestore → Règles**, pas dans **Storage → Règles**. Firestore est additif : le bloc global `match /{document=**}` doit être supprimé ou remplacé, sinon il autorise quand même la lecture de `leads` et des analytics.
> Si vous avez d'autres collections, ajoutez-les explicitement ; elles seront refusées par défaut.

### 3.5 Purge automatique des événements bruts

Dans la console Firebase : **Firestore → Index → Politique TTL**, créer une politique sur :

- collection : `analytics_events`
- champ : `expiresAt`

Et une seconde sur :

- collection : `analytics_submissions`
- champ : `expiresAt`

Et deux politiques de rétention (90 jours également) :

- collection : `analytics_session_days`, champ : `expiresAt`
- collection : `analytics_visitor_days`, champ : `expiresAt`

Firestore supprime alors automatiquement les événements, les soumissions et les identifiants de session/visiteur de plus de 90 jours. Les agrégats quotidiens (`analytics_daily`) n'ont pas de TTL : ils sont conservés **sans limite par défaut**. Si vous devez appliquer une limite (25 mois recommandés), ajoutez un champ `expiresAt` et une politique TTL, ou un nettoyage planifié.

---

## 4. Google Analytics (non utilisé)

Le tableau de bord `/Gestion` est **100 % first-party**. Aucun identifiant GA4 n'est présent dans le build et aucune donnée n'est envoyée à Google.

Si vous souhaitez activer GA4 plus tard, il faudra ajouter un tag GA4 dédié (et un bandeau de consentement) ; le tableau de bord admin ne l’affichera pas.

---

## 5. Test local

```bash
# Terminal 1 : émulateurs Functions + Firestore
firebase emulators:start --only functions,firestore

# Terminal 2 : site
VITE_ANALYTICS_URL=http://127.0.0.1:5001/webimmo-6189a/us-central1/track \
VITE_ANALYTICS_API_URL=http://127.0.0.1:5001/webimmo-6189a/us-central1/analytics \
npm run dev
```

En local, les URLs doivent être absolues car Vite ne réécrit pas `/api/*` vers les émulateurs.

---

## 6. Modèle de données

### Périodes du tableau de bord

Le tableau de bord propose **7, 30 ou 90 jours**, ainsi qu'une **période personnalisée** (366 jours maximum). L'API accepte :

- `GET /api/analytics?days=30`
- `GET /api/analytics?from=2026-10-01&to=2026-10-31`

Les dates sont incluses et interprétées en heure de Guadeloupe. Cela permet de comparer une période précise avec Google Ads. Si le compte Google Ads utilise un autre fuseau horaire, de légers écarts peuvent apparaître en fin de journée.

### `analytics_events/{autoId}`

Événement brut (rétention 90 jours via `expiresAt`) :

```json
{
  "type": "pageview | event",
  "name": "listing_view",
  "path": "/house/abc123",
  "title": "Villa ...",
  "source": "Google",
  "referrer": "google.com",
  "device": "mobile",
  "browser": "Chrome",
  "os": "Android",
  "country": "Guadeloupe",
  "language": "fr-FR",
  "timezone": "America/Guadeloupe",
  "visitorKey": "hash...",
  "sessionKey": "hash...",
  "meta": { "houseId": "abc123", "houseTitle": "Villa ..." },
  "date": "2026-11-07",
  "timestamp": "2026-11-07T14:32:00Z",
  "expiresAt": "2027-02-05T14:32:00Z"
}
```

### `analytics_daily/{YYYY-MM-DD}`

Agrégats lus par le tableau de bord :

- compteurs : `visitors`, `sessions`, `pageviews`, `events`, `emailsSent`, `emailsFailed`, `formStarts`, `formSubmits`, `whatsappClicks`, `phoneClicks`, `listingViews`, `listingClicks`, `searches`, `shares`, etc. ;
- cartes : `paths`, `sources`, `referrers`, `devices`, `browsers`, `os`, `countries`, `languages`, `eventsByName`, `houses`, `houseClicks`, `searchesByFilter`, `emailsByForm`, `pathDwell`, `pathDwellCount`, `pathScroll`, `pathScrollCount`.

### `analytics_submissions/{autoId}`

Une fiche par soumission de formulaire ou envoi d'email (sans contenu du formulaire) : type de formulaire, statut, page, pays, date. Rétention 90 jours via `expiresAt`. C'est cette collection qui alimente le tableau « derniers emails ».

### `analytics_session_days/{hash}`

Une fiche par session et par jour : première/dernière activité, pages vues, événements, source, appareil, pays, page d'arrivée.

### `analytics_visitor_days/{hash}`

Déduplication des visiteurs uniques par jour (un document par visiteur/jour).

---

## 7. Demandes (leads)

Chaque formulaire enregistre désormais la demande **avant** l'envoi EmailJS :

1. `POST /api/leads/submit` → la demande est écrite dans `leads` (statut `new`).
2. EmailJS envoie l'email.
3. `POST /api/leads/status` → le statut passe à `email_sent` ou `email_error`.

Ainsi, même si EmailJS échoue, la demande et son contenu restent visibles dans `/Gestion` → **Demandes**.

### Données stockées

`leads/{submissionId}` :

```json
{
  "type": "estimation | vendre | contact",
  "status": "new | email_sent | email_error",
  "contact": { "name": "...", "email": "...", "phone": "..." },
  "data": {
    "address": "...",
    "propertyType": "maison",
    "livingArea": "120",
    "project": "...",
    "availability": "...",
    "message": "..."
  },
  "pagePath": "/Estimation",
  "source": "Google",
  "createdAt": "...",
  "updatedAt": "...",
  "emailSentAt": "...",
  "emailError": null,
  "tokenHash": "..."
}
```

- Le contenu est celui saisi par le visiteur (champs whitelistés et limités).
- Le jeton de mise à jour est stocké **haché** ; il sert uniquement à autoriser le changement de statut email.
- Les demandes ne sont **pas supprimées automatiquement** : elles restent dans Firestore jusqu'à suppression manuelle. Définissez une durée de conservation (RGPD) et documentez-la.

### API

| Route | Méthode | Accès | Rôle |
|---|---|---|---|
| `/api/leads/submit` | POST | public, rate-limité | enregistrer une demande |
| `/api/leads/status` | POST | public + jeton | mettre à jour le statut email |
| `/api/leads` | GET | Firebase Auth + `ADMIN_EMAILS` | lire les demandes dans l'admin |

### Interface

`/Gestion` → **Demandes** :

- filtres par type, statut, période et recherche ;
- tableau des demandes ;
- fiche détaillée avec toutes les réponses du formulaire ;
- liens `mailto:` / `tel:` et copie.

### Rétention et RGPD

Les demandes contiennent des données personnelles (nom, email, téléphone, message). Il faut :

- informer les visiteurs de l'usage de leurs données ;
- limiter l'accès aux administrateurs (`ADMIN_EMAILS` + règles Firestore) ;
- définir une durée de conservation et supprimer les demandes anciennes ;
- prévoir un export/sauvegarde Firestore si nécessaire.

---

## 8. Ajouter un événement

Côté site :

```ts
import { trackEvent } from '../lib/tracking';

trackEvent('mon_evenement', { houseId: 'abc', method: 'test' });
```

1. Ajouter le nom dans `ALLOWED_EVENTS` (`functions/src/analytics.ts`) et, si besoin, dans `COUNTER_FOR_EVENT`.
2. Ajouter les clés de métadonnées dans `ALLOWED_META_KEYS` et dans `META_KEYS` (`src/lib/tracking.ts`).
3. Pour un libellé lisible dans la section avancée, compléter `EVENT_LABELS` (`src/components/adminAnalytics.tsx`).
4. Reconstruire et redéployer.

---

## 9. Limites connues

- Les emails sont envoyés par **EmailJS côté navigateur** : le compteur `emailsSent` repose sur l'événement émis après succès. Un bloqueur de publicité ou une coupure réseau peut empêcher l'événement, sans empêcher l'email.
- Les pays/régions sont **approximatifs**, déduits du fuseau horaire et de la langue : ce n'est pas une géolocalisation IP.
- Les visiteurs uniques sont dédupliqués par jour via un identifiant local anonyme. Un navigateur qui efface son stockage peut être recompté.
- Le tableau de bord agrège au maximum 5 000 sessions par période pour rester rapide ; au-delà, les moyennes de durée sont approximatives.
- Aucun historique antérieur au déploiement n'est disponible.
- Le tableau de bord propose 7, 30, 90 jours ou une **période personnalisée** (366 jours maximum) ; les agrégats quotidiens restent stockés dans `analytics_daily` au-delà de 90 jours.
- Pour les périodes anciennes, les agrégats quotidiens restent disponibles, mais le **détail** des emails, visites et actions est limité à 90 jours par la rétention TTL.
