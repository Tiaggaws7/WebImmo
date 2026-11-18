#!/usr/bin/env node
/**
 * Récupère les avis Google (et les réponses d'Elise) via l'API officielle
 * Google Business Profile, puis met à jour :
 *   - src/data/reviews.json      (avis affichés sur le site)
 *   - index.html                 (données structurées JSON-LD : note, nombre d'avis, 3 derniers avis)
 *
 * Aucune dépendance : Node 20+ (fetch natif).
 *
 * Variables d'environnement :
 *   GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN   (obligatoires)
 *   GBP_ACCOUNT_ID, GBP_LOCATION_ID                       (facultatives : détectées automatiquement
 *                                                          s'il n'y a qu'un seul établissement)
 *
 * Options :
 *   --dry-run          affiche le résultat sans rien écrire
 *   --from-file <f>    utilise une réponse d'API enregistrée (JSON) au lieu d'appeler Google (tests)
 *
 * Code de sortie : 0 = OK (fichiers modifiés ou non), 1 = erreur.
 * Sur GitHub Actions, écrit `changed=true|false` dans $GITHUB_OUTPUT.
 */
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REVIEWS_JSON = path.join(ROOT, "src/data/reviews.json");
const INDEX_HTML = path.join(ROOT, "index.html");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const fromFileIdx = args.indexOf("--from-file");
const FROM_FILE = fromFileIdx >= 0 ? args[fromFileIdx + 1] : null;

const STARS = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

// ---------------------------------------------------------------------------
// Appels à l'API Google
// ---------------------------------------------------------------------------

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GBP_CLIENT_ID"),
      client_secret: requireEnv("GBP_CLIENT_SECRET"),
      refresh_token: requireEnv("GBP_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(
      `Échec de l'authentification Google (${res.status}) : ${body.error ?? ""} ${body.error_description ?? ""}`.trim() +
        "\nSi le message est « invalid_grant », le jeton a expiré : relancez scripts/reviews/get-refresh-token.mjs.",
    );
  }
  return body.access_token;
}

async function apiGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  if (!res.ok) {
    let hint = "";
    if (res.status === 403 || res.status === 429) {
      hint =
        "\nL'accès à l'API Business Profile n'est peut-être pas encore accordé par Google " +
        "(quota à 0 tant que la demande d'accès n'est pas acceptée), ou l'API n'est pas activée dans le projet Google Cloud.";
    }
    throw new Error(`Erreur API ${res.status} sur ${url}\n${text.slice(0, 800)}${hint}`);
  }
  return JSON.parse(text);
}

async function findLocation(token) {
  const accountId = process.env.GBP_ACCOUNT_ID?.trim();
  const locationId = process.env.GBP_LOCATION_ID?.trim();
  if (accountId && locationId) {
    return { account: `accounts/${accountId.replace(/^accounts\//, "")}`, location: `locations/${locationId.replace(/^locations\//, "")}` };
  }

  const { accounts = [] } = await apiGet("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", token);
  const found = [];
  for (const acc of accounts) {
    if (accountId && !acc.name.endsWith(`/${accountId}`)) continue;
    let pageToken = "";
    do {
      const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations`);
      url.searchParams.set("readMask", "name,title");
      url.searchParams.set("pageSize", "100");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const data = await apiGet(url, token);
      for (const loc of data.locations ?? []) found.push({ account: acc.name, location: loc.name, title: loc.title });
      pageToken = data.nextPageToken ?? "";
    } while (pageToken);
  }

  const matches = locationId ? found.filter((f) => f.location.endsWith(`/${locationId}`)) : found;
  if (matches.length === 1) return matches[0];

  const list = found.map((f) => `  - ${f.title} → GBP_ACCOUNT_ID=${f.account.split("/")[1]} GBP_LOCATION_ID=${f.location.split("/")[1]}`).join("\n");
  throw new Error(
    matches.length === 0
      ? `Aucun établissement trouvé pour ce compte Google.${list ? `\nÉtablissements visibles :\n${list}` : ""}`
      : `Plusieurs établissements trouvés, précisez GBP_ACCOUNT_ID et GBP_LOCATION_ID :\n${list}`,
  );
}

async function fetchAllReviews(token, { account, location }) {
  const base = `https://mybusiness.googleapis.com/v4/${account}/${location}/reviews`;
  let pageToken = "";
  let averageRating = 0;
  let totalReviewCount = 0;
  const reviews = [];
  do {
    const url = new URL(base);
    url.searchParams.set("pageSize", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const data = await apiGet(url, token);
    reviews.push(...(data.reviews ?? []));
    averageRating = data.averageRating ?? averageRating;
    totalReviewCount = data.totalReviewCount ?? totalReviewCount;
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);
  return { reviews, averageRating, totalReviewCount };
}

// ---------------------------------------------------------------------------
// Transformation
// ---------------------------------------------------------------------------

/** Google ajoute parfois une traduction automatique : on garde le texte d'origine. */
export function cleanText(raw) {
  if (!raw) return "";
  let text = String(raw);
  const original = text.match(/\((?:Original|Texte d'origine)\)\s*\n([\s\S]*)$/);
  if (original) text = original[1];
  text = text.replace(/^\((?:Translated by Google|Traduit par Google)\)\s*/, "");
  return text.trim();
}

export function toSiteData(api) {
  const reviews = api.reviews
    .map((r) => ({
      id: r.reviewId ?? r.name?.split("/").pop() ?? "",
      author: r.reviewer?.isAnonymous ? "Un client Google" : (r.reviewer?.displayName?.trim() || "Un client Google"),
      rating: STARS[r.starRating] ?? 0,
      createTime: r.createTime,
      text: cleanText(r.comment),
      ownerResponse: cleanText(r.reviewReply?.comment) || null,
    }))
    .filter((r) => r.rating > 0)
    .sort((a, b) => (b.createTime ?? "").localeCompare(a.createTime ?? ""));

  const computedAverage = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return {
    statistics: {
      averageRating: Math.round((api.averageRating || computedAverage) * 10) / 10,
      totalReviews: api.totalReviewCount || reviews.length,
    },
    reviews,
  };
}

// ---------------------------------------------------------------------------
// Mise à jour du JSON-LD dans index.html
// ---------------------------------------------------------------------------

export function updateIndexHtml(html, data) {
  const re = /(<script type="application\/ld\+json">\n)([\s\S]*?)(\n(\s*)<\/script>)/g;
  let replaced = false;
  const out = html.replace(re, (whole, open, json, close, closeIndent) => {
    if (!json.includes('"aggregateRating"')) return whole;
    const ld = JSON.parse(json);
    const avg = data.statistics.averageRating.toFixed(1);
    const count = String(data.statistics.totalReviews);
    ld.aggregateRating = {
      ...ld.aggregateRating,
      ratingValue: avg,
      ratingCount: count,
      reviewCount: count,
    };
    ld.review = data.reviews
      .filter((r) => r.text)
      .slice(0, 3)
      .map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.author },
        datePublished: (r.createTime ?? "").slice(0, 10),
        reviewRating: { "@type": "Rating", ratingValue: String(r.rating), bestRating: "5" },
        reviewBody: r.text.replace(/\s*\n+\s*/g, " "),
      }));
    const indent = closeIndent + "  ";
    const body = JSON.stringify(ld, null, 2)
      .split("\n")
      .map((line) => indent + line)
      .join("\n");
    replaced = true;
    return open + body + close;
  });
  if (!replaced) throw new Error("Bloc JSON-LD avec aggregateRating introuvable dans index.html");
  return out;
}

// ---------------------------------------------------------------------------
// Programme principal
// ---------------------------------------------------------------------------

async function main() {
  let api;
  if (FROM_FILE) {
    api = JSON.parse(await readFile(FROM_FILE, "utf8"));
  } else {
    const token = await getAccessToken();
    const loc = await findLocation(token);
    console.log(`Établissement : ${loc.title ?? ""} (${loc.account}/${loc.location})`);
    api = await fetchAllReviews(token, loc);
  }

  const data = toSiteData(api);
  const previous = JSON.parse(await readFile(REVIEWS_JSON, "utf8"));

  // Garde-fou : on ne vide jamais le site à cause d'une réponse anormale de Google.
  if (data.reviews.length === 0) {
    throw new Error("Google n'a renvoyé aucun avis : mise à jour annulée par sécurité.");
  }
  if (data.reviews.length < previous.reviews.length / 2) {
    throw new Error(
      `Google a renvoyé ${data.reviews.length} avis contre ${previous.reviews.length} actuellement : mise à jour annulée par sécurité.`,
    );
  }

  const newJson = JSON.stringify(data, null, 2) + "\n";
  const oldJson = await readFile(REVIEWS_JSON, "utf8");
  const oldHtml = await readFile(INDEX_HTML, "utf8");
  const newHtml = updateIndexHtml(oldHtml, data);
  const changed = newJson !== oldJson || newHtml !== oldHtml;

  const withReply = data.reviews.filter((r) => r.ownerResponse).length;
  console.log(
    `${data.reviews.length} avis récupérés (note ${data.statistics.averageRating}/5, ${withReply} avec réponse). ` +
      (changed ? "Changements détectés." : "Aucun changement."),
  );

  if (DRY_RUN) {
    console.log(newJson.slice(0, 2000));
  } else if (changed) {
    await writeFile(REVIEWS_JSON, newJson);
    await writeFile(INDEX_HTML, newHtml);
    console.log("Fichiers mis à jour : src/data/reviews.json, index.html");
  }

  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed && !DRY_RUN}\n`);
  }
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
