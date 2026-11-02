# Configuration des Avis Google - Guide Moderne (2026)

> ⚠️ **OBSOLÈTE — ne pas suivre.** Le scraper d'avis Google (`fetchGoogleReviews`,
> `triggerFetchGoogleReviews`) et ses secrets ont été **supprimés** du projet.
> Les avis affichés sur le site viennent de [`src/data/reviews.json`](src/data/reviews.json).
> Les commandes `firebase functions:secrets:set` de ce guide sont la cause de la
> facture Secret Manager : ne les relancez pas.

## 🎯 Vue d'ensemble

Le composant d'avis Google a été activé sur votre page d'accueil. Ce guide utilise la **méthode moderne** recommandée par Firebase (params/secrets) au lieu de l'ancienne méthode `functions.config()` qui sera supprimée en mars 2026.

## ✅ Code mis à jour

Le code Firebase a été **automatiquement mis à jour** pour utiliser la nouvelle approche `defineSecret()` au lieu de l'ancienne méthode dépréciée.

## 🔧 Configuration Requise

### Étape 1 : Obtenir votre Place ID Google

**Méthode 1 - Place ID Finder (Recommandé)**
1. Visitez [Google Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
2. Entrez "Elise Buil Immobilier Guadeloupe" ou votre adresse
3. Copiez le Place ID (format: `ChIJ...`)

**Méthode 2 - Depuis Google Maps**
1. Ouvrez https://maps.app.goo.gl/aDU4gSfJta9741hV7
2. Dans l'URL complète de la page, cherchez le Place ID

### Étape 2 : Créer une clé API Google Places

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez ou sélectionnez un projet
3. Activez **Places API** dans **APIs & Services > Library**
4. Créez une clé API dans **APIs & Services > Credentials**
5. **Sécurisez votre clé** :
   - Cliquez sur la clé
   - Sous "API restrictions", sélectionnez "Restrict key"
   - Cochez uniquement "Places API"
   - Sauvegardez

### Étape 3 : Configurer les Secrets Firebase (Méthode Moderne)

#### Option A : Via Firebase CLI (Recommandé)

```bash
# 1. Installez Firebase CLI si nécessaire
npm install -g firebase-tools

# 2. Connectez-vous
firebase login

# 3. Allez dans le dossier functions
cd functions

# 4. Configurez les secrets (NOUVELLE MÉTHODE)
firebase functions:secrets:set GOOGLE_API_KEY
# Quand demandé, collez votre clé API Google

firebase functions:secrets:set GOOGLE_PLACE_ID
# Quand demandé, collez votre Place ID

# 5. Retournez au dossier racine
cd ..

# 6. Déployez les fonctions
firebase deploy --only functions
```

#### Option B : Via Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet Firebase
3. Allez dans **Security > Secret Manager**
4. Cliquez sur **Create Secret**
5. Créez deux secrets :
   - **Nom** : `GOOGLE_API_KEY` | **Valeur** : Votre clé API
   - **Nom** : `GOOGLE_PLACE_ID` | **Valeur** : Votre Place ID
6. Déployez les fonctions : `firebase deploy --only functions`

### Étape 4 : Vérification

Une fois configuré et déployé :

```bash
# Vérifiez les logs
firebase functions:log

# Ou testez manuellement depuis la console Firebase
# Firebase Console > Functions > fetchGoogleReviews > Run
```

**Vérification dans Firestore :**
1. Firebase Console > Firestore Database
2. Collection : `google_reviews`
3. Document : `summary`
4. Devrait contenir : `reviews`, `averageRating`, `reviewCount`

## 📊 Fonctionnement du Système

```
Google Maps Business
       ↓
Google Places API (avec clé API)
       ↓
Firebase Secret Manager (stockage sécurisé)
       ↓
Cloud Function (déclenchée toutes les 24h)
       ↓
Firestore Database (google_reviews/summary)
       ↓
Site Web (composant GoogleReviews)
```

## 🆚 Différences avec l'Ancienne Méthode

| Ancienne Méthode (Dépréciée) | Nouvelle Méthode (2026) |
|------------------------------|-------------------------|
| `firebase functions:config:set` | `firebase functions:secrets:set` |
| `process.env.VARIABLE` | `defineSecret()` et `.value()` |
| Variables d'environnement | Secrets sécurisés |
| ❌ Sera supprimé mars 2026 | ✅ Méthode recommandée |

## 🐛 Dépannage

### Erreur: "Secret GOOGLE_API_KEY not found"

**Solution :**
```bash
firebase functions:secrets:set GOOGLE_API_KEY
firebase deploy --only functions
```

### Erreur lors du déploiement

**Solutions possibles :**
1. Vérifiez que vous êtes connecté : `firebase login`
2. Vérifiez le projet : `firebase projects:list`
3. Sélectionnez le bon projet : `firebase use [project-id]`

### Les avis ne s'affichent pas

**Checklist :**
- ✅ Secrets configurés dans Secret Manager
- ✅ Fonction déployée sans erreur
- ✅ Places API activée dans Google Cloud
- ✅ Clé API correcte et non restreinte par IP
- ✅ Place ID valide

Consultez les logs : `firebase functions:log`

## � Coûts Google Places API

**Quota Gratuit :**
- 200$ de crédit mensuel offert par Google
- Environ 28,000 requêtes gratuites/mois
- La fonction s'exécute 1 fois par jour = 30 requêtes/mois
- **Donc : Totalement GRATUIT pour votre usage**

## 📝 Commandes Utiles

```bash
# Voir les secrets configurés
firebase functions:secrets:access GOOGLE_API_KEY
firebase functions:secrets:access GOOGLE_PLACE_ID

# Logs en temps réel
firebase functions:log --only fetchGoogleReviews

# Redéployer après modification
firebase deploy --only functions

# Tester localement (émulateur)
firebase emulators:start --only functions
```

## 🔗 Ressources

- [Firebase Secrets Documentation](https://firebase.google.com/docs/functions/config-env)
- [Migration Guide](https://firebase.google.com/docs/functions/config-env#migrate-config)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)

---

**Statut** : ✅ Code mis à jour | ⏳ Secrets à configurer
