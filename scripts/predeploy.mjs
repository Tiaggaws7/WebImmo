#!/usr/bin/env node
/**
 * Lancé automatiquement par `firebase deploy` avant de publier le site
 * (voir "predeploy" dans firebase.json).
 *
 * 1. Récupère les derniers commits de GitHub (git pull), notamment les avis
 *    Google ajoutés chaque jour par la tâche GitHub Actions. Sans ça, un
 *    déploiement depuis une copie pas à jour remettrait d'anciens avis en ligne.
 * 2. Reconstruit le site (npm run build), pour que dist/ contienne bien
 *    la version à jour.
 *
 * Sur GitHub Actions, ne fait rien : le site y est déjà construit à partir
 * de la dernière version.
 */
import { execFileSync } from "node:child_process";

const REVIEWS = "src/data/reviews.json";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function stop(message) {
  console.error(`\n❌ Déploiement annulé : ${message}\n`);
  process.exit(1);
}

if (process.env.GITHUB_ACTIONS) {
  console.log("predeploy : GitHub Actions, site déjà construit → rien à faire.");
  process.exit(0);
}

// 1. Se mettre à jour avec GitHub ------------------------------------------
let fetched = true;
try {
  git("fetch", "--quiet", "origin", "master");
} catch {
  fetched = false;
  console.warn("⚠️  Impossible de joindre GitHub (hors ligne ?) : déploiement sans vérification des derniers avis.");
}

if (fetched) {
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const behind = Number(git("rev-list", "--count", "HEAD..origin/master"));

  if (behind === 0) {
    console.log("✅ Copie locale à jour avec GitHub.");
  } else if (branch === "master") {
    console.log(`⬇️  ${behind} commit(s) plus récent(s) sur GitHub (avis Google…) : git pull…`);
    try {
      execFileSync("git", ["pull", "--rebase", "--autostash", "origin", "master"], { stdio: "inherit" });
    } catch {
      stop(
        "le git pull a échoué (conflit avec des modifications locales ?).\n" +
          "   Résolvez le conflit, ou annulez avec : git rebase --abort\n" +
          "   puis relancez firebase deploy.",
      );
    }
  } else {
    // Sur une autre branche, on ne touche pas à l'historique : on vérifie seulement les avis.
    let differs = false;
    try {
      git("diff", "--quiet", "HEAD", "origin/master", "--", REVIEWS);
    } catch {
      differs = true;
    }
    if (differs) {
      stop(
        `la branche « ${branch} » n'a pas les derniers avis Google de GitHub.\n` +
          "   Déployer maintenant remettrait d'anciens avis en ligne.\n" +
          "   Faites d'abord : git merge origin/master   (ou déployez depuis master)",
      );
    }
    console.log(`ℹ️  Branche « ${branch} » : avis Google à jour, déploiement autorisé.`);
  }
}

// 2. Reconstruire le site ---------------------------------------------------
console.log("🔨 Construction du site (npm run build)…");
try {
  execFileSync("npm", ["run", "build"], { stdio: "inherit", shell: process.platform === "win32" });
} catch {
  stop("la construction du site (npm run build) a échoué.");
}
