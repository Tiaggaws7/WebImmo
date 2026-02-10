# 🚀 Guide Rapide - Configuration Google Reviews

## ⚡ Commandes à Exécuter

### 1. Configurer les Secrets Firebase

```bash
# Naviguer vers le dossier functions
cd c:\Users\Propriétaire\Documents\code\webimmo\WebImmo\functions

# Configurer la clé API Google
firebase functions:secrets:set GOOGLE_API_KEY

# Configurer le Place ID
firebase functions:secrets:set GOOGLE_PLACE_ID

# Retourner au dossier racine
cd ..

# Déployer
firebase deploy --only functions
```

### 2. Où Trouver les Valeurs 

**Place ID :**
- Aller sur https://developers.google.com/maps/documentation/places/web-service/place-id
- Chercher "Elise Buil Immobilier Guadeloupe"
- Copier le Place ID (commence par `ChIJ...`)

**Clé API :**
- Aller sur https://console.cloud.google.com/
- APIs & Services > Credentials > Create Credentials > API Key
- Activer Places API
- Copier la clé

## ✅ Ce qui a été corrigé

Le code utilise maintenant la **nouvelle méthode Firebase 2026** :
- ✅ `defineSecret()` au lieu de `process.env`
- ✅ Compatible avec Firebase Functions v2
- ✅ Plus de message de dépréciation

## 📖 Documentation Complète

Voir [`GOOGLE_REVIEWS_SETUP.md`](file:///c:/Users/Propriétaire/Documents/code/webimmo/WebImmo/GOOGLE_REVIEWS_SETUP.md) pour le guide complet.

---

**Note :** L'ancienne commande `firebase functions:config:set` ne fonctionne plus. Utilisez `firebase functions:secrets:set` à la place.
