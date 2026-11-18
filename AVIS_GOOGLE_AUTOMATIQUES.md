# Avis Google automatiques

Les avis Google du site (et les réponses d'Elise) se mettent à jour **tout seuls, chaque jour**, gratuitement.

## Comment ça marche

```
Tous les jours à 6h17 (heure de Guadeloupe)
  GitHub Actions
    → API officielle Google Business Profile (tous les avis + réponses)
    → Rien de nouveau ? On s'arrête là.
    → Nouveauté ? Mise à jour de src/data/reviews.json et index.html,
      build du site, déploiement sur Firebase Hosting, commit dans GitHub.
```

| Élément | Fichier |
| --- | --- |
| Tâche quotidienne | [.github/workflows/update-google-reviews.yml](.github/workflows/update-google-reviews.yml) |
| Récupération des avis | [scripts/reviews/fetch-google-reviews.mjs](scripts/reviews/fetch-google-reviews.mjs) |
| Obtention du jeton (une seule fois) | [scripts/reviews/get-refresh-token.mjs](scripts/reviews/get-refresh-token.mjs) |
| Avis affichés | [src/data/reviews.json](src/data/reviews.json) |

**Coût : 0 €.** L'API Business Profile est gratuite, GitHub Actions est gratuit (environ 1 minute par jour), et les clés sont rangées dans les secrets GitHub (pas dans Secret Manager).

**Sécurité :** si Google ne renvoie aucun avis, ou moins de la moitié des avis actuels, la mise à jour est annulée et le site reste tel quel.

---

## Mise en place (une seule fois, environ 30 minutes + délai de Google)

### 0. Se faire ajouter comme gestionnaire de la fiche (fait par la personne qui gère la fiche)

La personne qui gère la fiche Google n'a qu'**une seule chose** à faire : ajouter le compte Google du développeur comme **gestionnaire** de la fiche (2 minutes, aucune connaissance technique nécessaire). Elle reste propriétaire ; un gestionnaire ne peut ni supprimer la fiche ni retirer le propriétaire.

1. Sur un ordinateur, se connecter au compte Google qui gère la fiche, puis chercher **« Elise BUIL »** sur [google.com](https://www.google.com).
2. Dans le panneau de gestion de la fiche, cliquer sur les **trois points ⋮** → **Paramètres de la fiche d'établissement** → **Personnes et accès** (ou « Gestionnaires »).
3. Cliquer sur **+ Ajouter**, saisir l'adresse Gmail du développeur, choisir le rôle **Gestionnaire**, puis **Inviter**.

Le développeur accepte ensuite l'invitation reçue par e-mail. Si Google refuse plus tard la demande d'accès à l'API avec un compte gestionnaire, refaire la même chose en choisissant le rôle **Propriétaire**.

**Toutes les étapes suivantes sont faites par le développeur, avec son propre compte Google** (devenu gestionnaire de la fiche).

### 1. Demander l'accès à l'API Business Profile (le plus long)

1. Ouvrir la [console Google Cloud](https://console.cloud.google.com/) et sélectionner le projet **webimmo-6189a**.
2. Noter le **numéro du projet** (page d'accueil du projet, carte « Informations sur le projet »).
3. Remplir le formulaire de demande d'accès : [Business Profile API – demande d'accès](https://support.google.com/business/contact/api_default).
   - Choisir « Application for Basic API Access ».
   - Indiquer l'adresse e-mail du compte gestionnaire de la fiche (étape 0), le numéro du projet et le site `https://elisebuilimmobilierguadeloupe.com`.
   - Motif : afficher ses propres avis sur son site.
4. Attendre l'e-mail de Google (quelques jours, parfois plus).

> Pour vérifier si l'accès est accordé : console Google Cloud → **API et services → My Business Account Management API → Quotas**. Si le quota est à **0**, ce n'est pas encore accordé. S'il est à **300 requêtes par minute**, c'est bon.

### 2. Activer les API

Console Google Cloud → **API et services → Bibliothèque**, puis activer :

- **My Business Account Management API**
- **My Business Business Information API**
- **Google My Business API** (n'apparaît parfois qu'après l'accord de Google)

### 3. Créer l'identifiant OAuth

1. **API et services → Écran de consentement OAuth** (ou « Google Auth Platform ») :
   - Type d'utilisateur : **Externe**.
   - Nom de l'application : par ex. « Avis site Elise BUIL ». Renseigner les e-mails demandés.
   - Ensuite, dans **Audience** (ou « État de publication ») : cliquer sur **Publier l'application / Passer en production**.
     ⚠️ Important : en mode « Test », le jeton expire au bout de 7 jours et la mise à jour s'arrêterait.
2. **API et services → Identifiants → Créer des identifiants → ID client OAuth** :
   - Type : **Application de bureau**.
   - Noter l'**ID client** et le **Code secret du client**.

### 4. Obtenir le jeton (sur l'ordinateur, dans le dossier du projet)

```bash
GBP_CLIENT_ID="ID_CLIENT" GBP_CLIENT_SECRET="CODE_SECRET" node scripts/reviews/get-refresh-token.mjs
```

- Le navigateur s'ouvre : se connecter avec le compte devenu gestionnaire de la fiche (étape 0).
- Si Google affiche « Google n'a pas validé cette application » : **Paramètres avancés → Accéder à … (non sécurisé)**. C'est normal, c'est votre propre application.
- Le terminal affiche le **jeton** (refresh token). Le garder pour l'étape 6.

Test immédiat (n'écrit rien) :

```bash
GBP_CLIENT_ID="ID_CLIENT" GBP_CLIENT_SECRET="CODE_SECRET" GBP_REFRESH_TOKEN="JETON" node scripts/reviews/fetch-google-reviews.mjs --dry-run
```

Il doit afficher « 23 avis récupérés… » (ou plus). Si le compte gère plusieurs établissements, le script affiche la liste avec les valeurs `GBP_ACCOUNT_ID` et `GBP_LOCATION_ID` à utiliser.

### 5. Créer la clé de déploiement Firebase

Console Google Cloud (projet webimmo-6189a) → **IAM et administration → Comptes de service → Créer un compte de service** :

1. Nom : `github-deploy-avis`.
2. Rôles :
   - **Administrateur Firebase Hosting**
   - **Lecteur Cloud Run** (nécessaire car le site redirige certaines pages vers les Cloud Functions)
   - **Lecteur des clés API**
3. Ouvrir le compte créé → **Clés → Ajouter une clé → Créer une clé → JSON**. Un fichier `.json` est téléchargé.

### 6. Ajouter les secrets dans GitHub

GitHub → dépôt **WebImmo** → **Settings → Secrets and variables → Actions → New repository secret** :

| Nom du secret | Valeur |
| --- | --- |
| `GBP_CLIENT_ID` | ID client OAuth (étape 3) |
| `GBP_CLIENT_SECRET` | Code secret du client (étape 3) |
| `GBP_REFRESH_TOKEN` | Jeton (étape 4) |
| `FIREBASE_SERVICE_ACCOUNT` | Tout le contenu du fichier `.json` (étape 5) |
| `VITE_ENV_FILE` | Tout le contenu du fichier `.env` local (nécessaire pour construire le site) |
| `GBP_ACCOUNT_ID`, `GBP_LOCATION_ID` | Facultatifs : seulement si le script l'a demandé à l'étape 4 |

Ensuite, supprimer le fichier `.json` de la clé de l'ordinateur.

### 7. Envoyer le code et lancer un premier essai

1. `git push` pour envoyer le workflow sur GitHub.
2. GitHub → onglet **Actions → Mise à jour des avis Google → Run workflow**.
3. Le premier passage remplace le contenu de `reviews.json` par les données exactes de Google (vraies dates, identifiants) et redéploie le site.

---

## À savoir au quotidien

- **Faire `git pull` avant de travailler sur le site** : GitHub enregistre lui-même les nouveaux avis dans le dépôt.
- **Toujours pousser (`git push`) ce qu'on déploie à la main.** Le déploiement automatique publie la version présente sur GitHub. Une modification déployée depuis l'ordinateur mais jamais poussée serait effacée au prochain nouvel avis.
- Si le fichier `.env` change, mettre à jour le secret `VITE_ENV_FILE`.
- En cas d'échec, GitHub envoie un e-mail. Le détail est dans l'onglet **Actions**. Si le message parle de `invalid_grant`, refaire l'étape 4 et remplacer `GBP_REFRESH_TOKEN`.
- Si le dépôt est **public**, GitHub met en pause les tâches planifiées après 60 jours sans activité dans le dépôt. Il prévient par e-mail ; il suffit de cliquer sur « Enable workflow » dans l'onglet Actions.
- Pour forcer une mise à jour tout de suite (par exemple juste après avoir répondu à un avis) : **Actions → Mise à jour des avis Google → Run workflow**.
- Les dates (« il y a 3 mois ») sont calculées à l'affichage : elles restent toujours justes.
- En attendant l'accord de Google, rien ne change : le site garde les avis actuels, qu'on peut toujours modifier à la main dans `reviews.json`.
