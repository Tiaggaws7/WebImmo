# Avis Google automatiques

Les avis Google du site (et les réponses d'Elise) se mettent à jour **tout seuls, chaque jour**, gratuitement.

## Comment ça marche

```
Tous les jours à 6h17 (heure de Guadeloupe)
  GitHub Actions
    → SerpApi lit la fiche Google Maps « Elise BUIL » (avis + réponses)
    → Rien de nouveau ? On s'arrête là.
    → Nouveauté ? Mise à jour de src/data/reviews.json et index.html,
      build du site, déploiement sur Firebase Hosting, commit dans GitHub.
```

| Élément | Fichier |
| --- | --- |
| Tâche quotidienne | [.github/workflows/update-google-reviews.yml](.github/workflows/update-google-reviews.yml) |
| Récupération des avis | [scripts/reviews/fetch-google-reviews.mjs](scripts/reviews/fetch-google-reviews.mjs) |
| Avis affichés | [src/data/reviews.json](src/data/reviews.json) |

**Coût : 0 €.**
- SerpApi : offre gratuite de 250 recherches par mois. Le script n'en utilise qu'**une par jour** quand rien n'a changé (il ne lit que les avis les plus récents), et relit tout le dimanche ou quand un avis ou une réponse apparaît : environ 40 recherches par mois.
- GitHub Actions est gratuit (environ 1 minute par jour), et les clés sont rangées dans les secrets GitHub (pas dans Secret Manager).

**Sécurité :** la mise à jour est annulée (le site reste tel quel) si aucun avis n'est reçu, si moins de la moitié des avis actuels est reçue, ou si aucune réponse d'Elise n'est reçue alors que le site en affiche.

---

## Mise en place (une seule fois, environ 15 minutes)

### 1. Créer un compte SerpApi gratuit

1. Aller sur [serpapi.com](https://serpapi.com/users/sign_up) et créer un compte (offre **Free**, aucune carte bancaire demandée).
2. Confirmer l'adresse e-mail (et le numéro de téléphone si SerpApi le demande).
3. Ouvrir [serpapi.com/manage-api-key](https://serpapi.com/manage-api-key) et copier la **clé API** (« Private API Key »).

### 2. Tester sur l'ordinateur (n'écrit rien)

Dans un terminal, dans le dossier `WebImmo` :

```bash
SERPAPI_KEY="COLLE_LA_CLE" node scripts/reviews/fetch-google-reviews.mjs --full --dry-run
```

Il doit afficher « 23 avis récupérés (note 5/5, 23 avec réponse) » (ou plus). **Vérifier que le nombre « avec réponse » n'est pas 0** : sinon, SerpApi ne renvoie pas les réponses et le script refusera de mettre à jour le site.

### 3. Créer la clé de déploiement Firebase

Console Google Cloud (projet webimmo-6189a) → **IAM et administration → Comptes de service → Créer un compte de service** :

1. Nom : `github-deploy-avis`.
2. Rôles :
   - **Administrateur Firebase Hosting**
   - **Lecteur Cloud Run** (nécessaire car le site redirige certaines pages vers les Cloud Functions)
   - **Lecteur des clés API**
3. Ouvrir le compte créé → **Clés → Ajouter une clé → Créer une clé → JSON**. Un fichier `.json` est téléchargé.

### 4. Ajouter les secrets dans GitHub

GitHub → dépôt **WebImmo** → **Settings → Secrets and variables → Actions → New repository secret** :

| Nom du secret | Valeur |
| --- | --- |
| `SERPAPI_KEY` | Clé API SerpApi (étape 1) |
| `FIREBASE_SERVICE_ACCOUNT` | Tout le contenu du fichier `.json` (étape 3) |
| `VITE_ENV_FILE` | Tout le contenu du fichier `.env` local (nécessaire pour construire le site) |

Ensuite, supprimer le fichier `.json` de la clé de l'ordinateur.

### 5. Envoyer le code et lancer un premier essai

1. Pousser le code sur la branche `master` de GitHub.
2. GitHub → onglet **Actions → Mise à jour des avis Google → Run workflow** (un lancement manuel relit toujours tous les avis).
3. Le premier passage remplace le contenu de `reviews.json` par les données exactes de Google (vraies dates, identifiants) et redéploie le site.

---

## À savoir au quotidien

- **Déploiement manuel : `firebase deploy` suffit.** Avant de publier, il fait automatiquement un `git pull` (pour récupérer les avis ajoutés par GitHub) puis `npm run build` ([scripts/predeploy.mjs](scripts/predeploy.mjs), déclaré dans `firebase.json`). Plus besoin de lancer `npm run build` avant.
  - Sur une autre branche que `master`, il ne touche pas à l'historique : si la branche n'a pas les derniers avis, le déploiement est bloqué avec la commande à lancer (`git merge origin/master`).
  - Sans connexion à GitHub, il prévient et déploie quand même.
- **Toujours pousser (`git push`) ce qu'on déploie à la main.** Le déploiement automatique publie la version présente sur GitHub. Une modification déployée depuis l'ordinateur mais jamais poussée serait effacée au prochain nouvel avis.
- Si le fichier `.env` change, mettre à jour le secret `VITE_ENV_FILE`.
- En cas d'échec, GitHub envoie un e-mail. Le détail est dans l'onglet **Actions**.
- Si le dépôt est **public**, GitHub met en pause les tâches planifiées après 60 jours sans activité dans le dépôt. Il prévient par e-mail ; il suffit de cliquer sur « Enable workflow » dans l'onglet Actions.
- Pour forcer une mise à jour tout de suite (par exemple juste après avoir répondu à un avis) : **Actions → Mise à jour des avis Google → Run workflow**.
- La consommation SerpApi du mois est visible sur [serpapi.com/dashboard](https://serpapi.com/dashboard).
- Les dates (« il y a 3 mois ») sont calculées à l'affichage : elles restent toujours justes.

---

## Option : API officielle Google Business Profile

Le script sait aussi utiliser l'API officielle de Google, plus fiable à long terme. La demande d'accès a été **refusée** en novembre 2026 (refus automatique, sans motif, alors que la fiche est validée depuis plus d'un an). On peut la retenter plus tard via le [formulaire de demande d'accès](https://support.google.com/business/contact/api_default) (« Application for Basic API Access », numéro de projet Cloud, compte administrateur de la fiche).

Si elle est acceptée (quota de **300 requêtes/minute** dans **API et services → My Business Account Management API → Quotas**) :

1. Activer **My Business Account Management API**, **My Business Business Information API** et **Google My Business API**.
2. Écran de consentement OAuth : type **Externe**, puis **Publier l'application** (en mode « Test », le jeton expire au bout de 7 jours).
3. Identifiants → **ID client OAuth** de type **Application de bureau**.
4. Obtenir le jeton (connexion avec le compte administrateur de la fiche) :

   ```bash
   GBP_CLIENT_ID="ID_CLIENT" GBP_CLIENT_SECRET="CODE_SECRET" node scripts/reviews/get-refresh-token.mjs
   ```

5. Ajouter les secrets `GBP_CLIENT_ID`, `GBP_CLIENT_SECRET`, `GBP_REFRESH_TOKEN` dans GitHub, puis **supprimer le secret `SERPAPI_KEY`** (tant qu'il existe, c'est SerpApi qui est utilisé).
