#!/usr/bin/env node
/**
 * Récupère les avis Google de la fiche « Elise BUIL » (et les réponses),
 * puis met à jour :
 *   - src/data/reviews.json      (avis affichés sur le site)
 *   - index.html                 (données structurées JSON-LD : note, nombre d'avis, 3 derniers avis)
 *
 * Deux sources possibles (choisie automatiquement) :
 *
 *   1. SerpApi (si SERPAPI_KEY est défini) — lit la fiche Google Maps publique.
 *        SERPAPI_KEY        clé de l'offre gratuite SerpApi (250 recherches / mois)
 *        GOOGLE_MAPS_DATA_ID  identifiant de la fiche (valeur par défaut : celle d'Elise BUIL)
 *      Pour économiser le quota, une exécution normale ne lit que la 1re page
 *      (avis les plus récents) et ne relit tout que si quelque chose a changé.
 *      Avec --full (ou le dimanche), tout est relu.
 *
 *   2. API officielle Google Business Profile (si l'accès est un jour accordé).
 *        GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN   (obligatoires)
 *        GBP_ACCOUNT_ID, GBP_LOCATION_ID                       (facultatives)
 *
 * Options :
 *   --dry-run            affiche le résultat sans rien écrire
 *   --full               (SerpApi) relit tous les avis, même sans changement apparent
 *   --from-file <f>      utilise une réponse Business Profile enregistrée (tests)
 *
 * Code de sortie : 0 = OK (fichiers modifiés ou non), 1 = erreur.
 * Sur GitHub Actions, écrit `changed=true|false` dans $GITHUB_OUTPUT.
 *
 * Aucune dépendance : Node 20+ (fetch natif).
 */
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REVIEWS_JSON = path.join(ROOT, "src/data/reviews.json");
const INDEX_HTML = path.join(ROOT, "index.html");

/** Fiche Google Maps « Elise BUIL » (extrait du lien maps.app.goo.gl de la fiche). */
const DEFAULT_DATA_ID = "0xa1e7abce3b7c5abf:0xa07e51ac209254d1";
const ANONYMOUS = "Un client Google";
const STARS = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

function env(name) {
  return process.env[name]?.trim() || "";
}

function requireEnv(name) {
  const value = env(name);
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

/** Google ajoute parfois une traduction automatique : on garde le texte d'origine. */
export function cleanText(raw) {
  if (!raw) return "";
  let text = String(raw);
  const original = text.match(/\((?:Original|Texte d'origine)\)\s*\n([\s\S]*)$/);
  if (original) text = original[1];
  text = text.replace(/^\((?:Translated by Google|Traduit par Google)\)\s*/, "");
  return text.trim();
}

/** Avis normalisés → contenu de reviews.json */
export function buildSiteData({ reviews, averageRating, totalReviewCount }) {
  const sorted = reviews
    .filter((r) => r.rating > 0)
    .sort((a, b) => (b.createTime ?? "").localeCompare(a.createTime ?? ""));
  const computedAverage = sorted.length ? sorted.reduce((s, r) => s + r.rating, 0) / sorted.length : 0;
  return {
    statistics: {
      averageRating: Math.round((averageRating || computedAverage) * 10) / 10,
      totalReviews: totalReviewCount || sorted.length,
    },
    reviews: sorted.map((r) => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      createTime: r.createTime,
      text: r.text,
      ownerResponse: r.ownerResponse,
    })),
  };
}

// ---------------------------------------------------------------------------
// Source 1 : SerpApi (fiche Google Maps publique)
// ---------------------------------------------------------------------------

async function serpGet(params) {
  const url = new URL("https://serpapi.com/search.json");
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  url.searchParams.set("api_key", requireEnv("SERPAPI_KEY"));
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const msg = body.error ?? `HTTP ${res.status}`;
    const hint = /run out|limit|quota/i.test(msg) ? "\nLe quota gratuit SerpApi du mois est peut-être épuisé." : "";
    throw new Error(`Erreur SerpApi : ${msg}${hint}`);
  }
  return body;
}

export function normalizeSerpReview(r) {
  const text = r.extracted_snippet?.original ?? r.snippet ?? "";
  const reply = r.response?.extracted_snippet?.original ?? r.response?.snippet ?? "";
  return {
    id: r.review_id ?? "",
    author: r.user?.name?.trim() || ANONYMOUS,
    rating: Math.round(Number(r.rating) || 0),
    createTime: r.iso_date ?? "",
    text: cleanText(text),
    ownerResponse: cleanText(reply) || null,
  };
}

async function fetchSerpPage(dataId, nextPageToken) {
  return serpGet({
    engine: "google_maps_reviews",
    data_id: dataId,
    hl: "fr",
    sort_by: "newestFirst",
    // `num` n'est accepté qu'à partir de la 2e page.
    num: nextPageToken ? 20 : undefined,
    next_page_token: nextPageToken,
  });
}

/** Vrai si la 1re page (avis les plus récents) est identique à ce qui est déjà sur le site. */
export function firstPageUnchanged(page, previous) {
  const total = page.place_info?.reviews;
  if (total !== undefined && total !== previous.statistics.totalReviews) return false;
  const rating = page.place_info?.rating;
  if (rating !== undefined && Math.round(rating * 10) / 10 !== previous.statistics.averageRating) return false;
  const known = new Map(previous.reviews.map((r) => [r.id, r]));
  return (page.reviews ?? []).map(normalizeSerpReview).every((r) => {
    const old = known.get(r.id);
    return old && old.text === r.text && old.ownerResponse === r.ownerResponse && old.rating === r.rating;
  });
}

async function fetchFromSerpApi(previous, { full }) {
  const dataId = env("GOOGLE_MAPS_DATA_ID") || DEFAULT_DATA_ID;
  let page = await fetchSerpPage(dataId);
  console.log(`Source : SerpApi (fiche « ${page.place_info?.title ?? dataId} »)`);

  if (!full && firstPageUnchanged(page, previous)) {
    console.log("Avis les plus récents identiques à ceux du site : pas de lecture complète (1 recherche utilisée).");
    return null;
  }

  const info = page.place_info ?? {};
  const reviews = [...(page.reviews ?? [])];
  let pages = 1;
  while (page.serpapi_pagination?.next_page_token && pages < 30) {
    page = await fetchSerpPage(dataId, page.serpapi_pagination.next_page_token);
    reviews.push(...(page.reviews ?? []));
    pages++;
  }
  console.log(`${pages} recherche(s) SerpApi utilisée(s).`);

  // Une page peut chevaucher la précédente : on retire les doublons.
  const seen = new Set();
  const normalized = reviews.map(normalizeSerpReview).filter((r) => {
    if (!r.id) return true;
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  return { reviews: normalized, averageRating: info.rating, totalReviewCount: info.reviews };
}

// ---------------------------------------------------------------------------
// Source 2 : API officielle Google Business Profile
// ---------------------------------------------------------------------------

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
  const accountId = env("GBP_ACCOUNT_ID");
  const locationId = env("GBP_LOCATION_ID");
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

  const matches = locationId
    ? found.filter((f) => f.location.endsWith(`/${locationId}`))
    : found.filter((f) => /elise\s*buil/i.test(f.title ?? ""));
  if (matches.length === 1) return matches[0];

  const list = found.map((f) => `  - ${f.title} → GBP_ACCOUNT_ID=${f.account.split("/")[1]} GBP_LOCATION_ID=${f.location.split("/")[1]}`).join("\n");
  throw new Error(
    matches.length === 0
      ? `Fiche « Elise BUIL » introuvable pour ce compte Google.${list ? `\nÉtablissements visibles :\n${list}` : ""}`
      : `Plusieurs établissements trouvés, précisez GBP_ACCOUNT_ID et GBP_LOCATION_ID :\n${list}`,
  );
}

export function normalizeGbp(api) {
  return {
    reviews: (api.reviews ?? []).map((r) => ({
      id: r.reviewId ?? r.name?.split("/").pop() ?? "",
      author: r.reviewer?.isAnonymous ? ANONYMOUS : r.reviewer?.displayName?.trim() || ANONYMOUS,
      rating: STARS[r.starRating] ?? 0,
      createTime: r.createTime,
      text: cleanText(r.comment),
      ownerResponse: cleanText(r.reviewReply?.comment) || null,
    })),
    averageRating: api.averageRating,
    totalReviewCount: api.totalReviewCount,
  };
}

async function fetchFromBusinessProfile() {
  const token = await getAccessToken();
  const loc = await findLocation(token);
  console.log(`Source : API Business Profile (${loc.title ?? ""} ${loc.account}/${loc.location})`);
  const base = `https://mybusiness.googleapis.com/v4/${loc.account}/${loc.location}/reviews`;
  let pageToken = "";
  const api = { reviews: [], averageRating: 0, totalReviewCount: 0 };
  do {
    const url = new URL(base);
    url.searchParams.set("pageSize", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const data = await apiGet(url, token);
    api.reviews.push(...(data.reviews ?? []));
    api.averageRating = data.averageRating ?? api.averageRating;
    api.totalReviewCount = data.totalReviewCount ?? api.totalReviewCount;
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);
  return normalizeGbp(api);
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

async function setOutput(changed) {
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
}

export async function main(argv = process.argv.slice(2)) {
  const dryRun = argv.includes("--dry-run");
  const full = argv.includes("--full") || new Date().getUTCDay() === 0;
  const fromFileIdx = argv.indexOf("--from-file");
  const fromFile = fromFileIdx >= 0 ? argv[fromFileIdx + 1] : null;

  const oldJson = await readFile(REVIEWS_JSON, "utf8");
  const previous = JSON.parse(oldJson);

  let normalized;
  if (fromFile) {
    normalized = normalizeGbp(JSON.parse(await readFile(fromFile, "utf8")));
  } else if (env("SERPAPI_KEY")) {
    normalized = await fetchFromSerpApi(previous, { full });
  } else if (env("GBP_REFRESH_TOKEN")) {
    normalized = await fetchFromBusinessProfile();
  } else {
    throw new Error("Aucune source configurée : définissez SERPAPI_KEY (ou les identifiants GBP_*).");
  }

  if (!normalized) {
    await setOutput(false);
    return;
  }

  const data = buildSiteData(normalized);

  // Garde-fou : on ne vide jamais le site à cause d'une réponse anormale.
  if (data.reviews.length === 0) {
    throw new Error("Aucun avis reçu : mise à jour annulée par sécurité.");
  }
  if (data.reviews.length < previous.reviews.length / 2) {
    throw new Error(
      `${data.reviews.length} avis reçus contre ${previous.reviews.length} actuellement : mise à jour annulée par sécurité.`,
    );
  }

  const hadReplies = previous.reviews.some((r) => r.ownerResponse);
  if (hadReplies && !data.reviews.some((r) => r.ownerResponse)) {
    throw new Error("Aucune réponse du propriétaire reçue alors que le site en affiche : mise à jour annulée par sécurité.");
  }

  const newJson = JSON.stringify(data, null, 2) + "\n";
  const oldHtml = await readFile(INDEX_HTML, "utf8");
  const newHtml = updateIndexHtml(oldHtml, data);
  const changed = newJson !== oldJson || newHtml !== oldHtml;

  const withReply = data.reviews.filter((r) => r.ownerResponse).length;
  console.log(
    `${data.reviews.length} avis récupérés (note ${data.statistics.averageRating}/5, ${withReply} avec réponse). ` +
      (changed ? "Changements détectés." : "Aucun changement."),
  );

  if (dryRun) {
    console.log(newJson.slice(0, 3000));
  } else if (changed) {
    await writeFile(REVIEWS_JSON, newJson);
    await writeFile(INDEX_HTML, newHtml);
    console.log("Fichiers mis à jour : src/data/reviews.json, index.html");
  }
  await setOutput(changed && !dryRun);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((err) => {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  });
}
