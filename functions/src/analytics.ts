import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { createHash } from "crypto";

/**
 * Mesure d'audience first-party.
 *
 * - `track`   : collecteur public appelé par le site (sendBeacon).
 * - `analytics`: API privée du panneau d'administration (Firebase ID token).
 *
 * Aucune adresse IP ni donnée personnelle n'est stockée. Les identifiants
 * visiteurs/sessions sont hachés avant écriture, et les événements bruts
 * expirent automatiquement via la politique TTL Firestore (`expiresAt`).
 */

const DAILY_COLLECTION = "analytics_daily";
const EVENTS_COLLECTION = "analytics_events";
const SESSIONS_COLLECTION = "analytics_session_days";
const VISITOR_DAYS_COLLECTION = "analytics_visitor_days";
const SUBMISSIONS_COLLECTION = "analytics_submissions";
const RETENTION_DAYS = 90;
const MAX_SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
const GUADELOUPE_TZ = "America/Guadeloupe";
const MAX_BODY_BYTES = 16 * 1024;
const HASH_SALT = process.env.ANALYTICS_HASH_SALT || "webimmo-analytics-v1";
const KNOWN_PATHS = new Set(["/", "/Acheter", "/Vendre", "/EliseBUIL", "/Estimation"]);

const ALLOWED_EVENTS = new Set([
  "page_leave",
  "scroll_depth",
  "listing_view",
  "listing_click",
  "search",
  "form_start",
  "form_step",
  "form_submit",
  "email_sent",
  "email_error",
  "whatsapp_click",
  "phone_click",
  "email_click",
  "outbound_click",
  "share",
  "gallery_open",
  "qr_download",
  "virtual_tour_open",
]);

const ALLOWED_META_KEYS = new Set([
  "form",
  "step",
  "status",
  "houseId",
  "houseTitle",
  "price",
  "location",
  "resultCount",
  "filters",
  "method",
  "target",
  "depth",
  "maxScroll",
  "dwellMs",
  "imageIndex",
  "platform",
  "source",
]);

/** Compteurs quotidiens alimentés par les événements. */
const COUNTER_FOR_EVENT: Record<string, string> = {
  listing_view: "listingViews",
  listing_click: "listingClicks",
  search: "searches",
  form_start: "formStarts",
  form_submit: "formSubmits",
  email_sent: "emailsSent",
  email_error: "emailsFailed",
  whatsapp_click: "whatsappClicks",
  phone_click: "phoneClicks",
  email_click: "emailClicks",
  outbound_click: "outboundClicks",
  share: "shares",
  gallery_open: "galleryOpens",
  qr_download: "qrDownloads",
  virtual_tour_open: "virtualTourOpens",
  scroll_depth: "scrollEvents",
};

const NUMBER_FIELDS = [
  "visitors",
  "sessions",
  "pageviews",
  "events",
  "listingViews",
  "listingClicks",
  "searches",
  "formStarts",
  "formSubmits",
  "emailsSent",
  "emailsFailed",
  "whatsappClicks",
  "phoneClicks",
  "emailClicks",
  "outboundClicks",
  "shares",
  "galleryOpens",
  "qrDownloads",
  "virtualTourOpens",
  "scrollEvents",
];

const MAP_FIELDS = [
  "paths",
  "sources",
  "referrers",
  "devices",
  "browsers",
  "os",
  "countries",
  "languages",
  "eventsByName",
  "houses",
  "houseClicks",
  "searchesByFilter",
  "emailsByForm",
  "pathDwell",
  "pathDwellCount",
  "pathScroll",
  "pathScrollCount",
];

type TrackPayload = {
  type?: unknown;
  name?: unknown;
  path?: unknown;
  title?: unknown;
  referrer?: unknown;
  utm?: Record<string, unknown>;
  visitorId?: unknown;
  sessionId?: unknown;
  firstVisitToday?: unknown;
  newSession?: unknown;
  screen?: unknown;
  viewport?: unknown;
  language?: unknown;
  timezone?: unknown;
  connection?: unknown;
  meta?: Record<string, unknown>;
};

type DailyRow = Record<string, number | string | Record<string, number>>;

/** Clé de map Firestore : base64url, donc sans point ni caractère réservé. */
function mapKey(value: string): string {
  return Buffer.from(value.slice(0, 100), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeMapKey(value: string): string {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(normalized, "base64").toString("utf8");
  } catch {
    return value;
  }
}

function hash(value: string, length = 24): string {
  return createHash("sha256").update(`${HASH_SALT}:${value}`).digest("hex").slice(0, length);
}

function cleanString(value: unknown, maxLength = 120): string {
  if (typeof value !== "string") return "";
  let cleaned = "";
  for (const character of value) {
    const code = character.codePointAt(0) || 0;
    cleaned += code < 32 || code === 127 ? " " : character;
  }
  return cleaned.trim().slice(0, maxLength);
}

function cleanId(value: unknown): string {
  const id = cleanString(value, 80);
  return /^[A-Za-z0-9_-]{8,80}$/.test(id) ? id : "";
}

function cleanPath(value: unknown): string {
  let path = cleanString(value, 200);
  if (!path) return "";
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.split(/[?#]/)[0];
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (path.startsWith("/Gestion") || path.startsWith("/api/")) return "";

  if (path.startsWith("/house/")) {
    const id = path.slice("/house/".length);
    return /^[A-Za-z0-9_-]{1,80}$/.test(id) ? `/house/${id}` : "/autre";
  }

  // Évite qu'un robot ou un lien aléatoire fasse exploser les cartes
  // d'agrégation avec des milliers de chemins distincts.
  return KNOWN_PATHS.has(path) ? path : "/autre";
}

function cleanEventName(value: unknown): string {
  const name = cleanString(value, 60).toLowerCase();
  return ALLOWED_EVENTS.has(name) ? name : "";
}

function sanitizeMeta(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const meta: Record<string, string | number | boolean> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!ALLOWED_META_KEYS.has(key) || raw === undefined || raw === null) continue;
    if (typeof raw === "string") {
      const text = cleanString(raw, 120);
      if (text) meta[key] = text;
    } else if (typeof raw === "number" && Number.isFinite(raw)) {
      meta[key] = raw;
    } else if (typeof raw === "boolean") {
      meta[key] = raw;
    }
  }
  return meta;
}

function guadeloupeDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: GUADELOUPE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDays(dateKey: string, delta: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day) + delta * 86_400_000);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function parseUserAgent(userAgent: string): { device: string; browser: string; os: string } {
  const ua = userAgent.toLowerCase();
  const device = /ipad|tablet|playbook|silk|android(?!.*mobile)/.test(ua)
    ? "tablet"
    : /mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)
      ? "mobile"
      : "desktop";

  let browser = "Autre";
  if (/edg\//.test(ua)) browser = "Edge";
  else if (/opr\/|opera/.test(ua)) browser = "Opera";
  else if (/samsungbrowser/.test(ua)) browser = "Samsung Internet";
  else if (/firefox|fxios/.test(ua)) browser = "Firefox";
  else if (/crios|chrome|chromium/.test(ua)) browser = "Chrome";
  else if (/safari/.test(ua)) browser = "Safari";

  let os = "Autre";
  if (/windows/.test(ua)) os = "Windows";
  else if (/android/.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod|ios/.test(ua)) os = "iOS";
  else if (/mac os x|macintosh/.test(ua)) os = "macOS";
  else if (/linux/.test(ua)) os = "Linux";

  return { device, browser, os };
}

function deviceFromViewport(viewport: string, fallback: string): string {
  // L'User-Agent est plus fiable qu'une largeur de fenêtre (téléphone en
  // paysage, tablette…). La largeur sert seulement à corriger un UA desktop.
  if (fallback === "mobile" || fallback === "tablet") return fallback;
  const width = Number(viewport.split("x")[0]);
  if (!Number.isFinite(width) || width <= 0) return fallback;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

const TIMEZONE_COUNTRIES: Record<string, string> = {
  "America/Guadeloupe": "Guadeloupe",
  "America/Martinique": "Martinique",
  "America/Cayenne": "Guyane",
  "Europe/Paris": "France",
  "Europe/Brussels": "Belgique",
  "Europe/Zurich": "Suisse",
  "Europe/London": "Royaume-Uni",
  "Europe/Madrid": "Espagne",
  "Europe/Lisbon": "Portugal",
  "Europe/Rome": "Italie",
  "Europe/Berlin": "Allemagne",
  "America/Toronto": "Canada",
  "America/Montreal": "Canada",
  "America/New_York": "États-Unis",
  "America/Los_Angeles": "États-Unis",
};

function countryFromTimezone(timezone: string, language: string): string {
  if (TIMEZONE_COUNTRIES[timezone]) return TIMEZONE_COUNTRIES[timezone];
  if (timezone.startsWith("America/")) return "Amériques";
  if (timezone.startsWith("Europe/")) return "Europe";
  if (timezone.startsWith("Africa/")) return "Afrique";
  if (timezone.startsWith("Asia/")) return "Asie";
  if (timezone.startsWith("Indian/")) return "Océan Indien";
  if (timezone.startsWith("Pacific/")) return "Pacifique";
  if (timezone.startsWith("Australia/")) return "Océanie";
  if (language.startsWith("fr")) return "Francophone";
  return "Inconnu";
}

const SOURCE_LABELS: Array<[RegExp, string]> = [
  [/google\./, "Google"],
  [/bing\./, "Bing"],
  [/yahoo\./, "Yahoo"],
  [/facebook\.|fb\./, "Facebook"],
  [/instagram\./, "Instagram"],
  [/linkedin\./, "LinkedIn"],
  [/tiktok\./, "TikTok"],
  [/pinterest\./, "Pinterest"],
  [/whatsapp\.|wa\.me/, "WhatsApp"],
  [/leboncoin\./, "Leboncoin"],
  [/seloger\./, "SeLoger"],
  [/bienici\./, "Bien'ici"],
  [/pap\.fr/, "PAP"],
  [/youtube\./, "YouTube"],
  [/twitter\.|x\.com/, "X"],
];

const SOURCE_NAMES: Record<string, string> = {
  google: "Google",
  bing: "Bing",
  yahoo: "Yahoo",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  whatsapp: "WhatsApp",
  leboncoin: "Leboncoin",
  seloger: "SeLoger",
  bienici: "Bien'ici",
  pap: "PAP",
  youtube: "YouTube",
  twitter: "X",
  x: "X",
};

function labelSource(value: string): string {
  const normalized = value.toLowerCase();
  if (SOURCE_NAMES[normalized]) return SOURCE_NAMES[normalized];
  const match = SOURCE_LABELS.find(([pattern]) => pattern.test(normalized));
  return match ? match[1] : cleanString(value, 40);
}

function sourceFrom(
  referrer: string,
  utmSource: string,
): { source: string; referrerHost: string } {
  if (utmSource) return { source: labelSource(utmSource), referrerHost: "" };
  if (!referrer) return { source: "Direct", referrerHost: "" };

  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return { source: "Direct", referrerHost: "" };
  }

  if (!host || host === "elisebuilimmobilierguadeloupe.com") {
    return { source: "Direct", referrerHost: "" };
  }

  const match = SOURCE_LABELS.find(([pattern]) => pattern.test(host));
  return { source: match ? match[1] : host, referrerHost: host };
}

async function createIfMissing(
  reference: admin.firestore.DocumentReference,
  data: Record<string, unknown>,
): Promise<boolean> {
  try {
    await reference.create(data);
    return true;
  } catch (error) {
    const code = (error as { code?: number | string }).code;
    if (code === 6 || code === "already-exists" || code === "ALREADY_EXISTS") return false;
    throw error;
  }
}

/**
 * Limite simple en mémoire : protège Firestore contre un envoi massif
 * d'événements. La clé est un hash de l'IP, jamais l'IP en clair.
 */
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(clientKey: string): boolean {
  if (!clientKey || clientKey === "unknown") return false;
  const key = hash(clientKey, 16);
  const now = Date.now();
  const entry = rateLimit.get(key);

  if (!entry || entry.resetAt <= now) {
    if (rateLimit.size > 2000) {
      for (const [existingKey, existing] of rateLimit) {
        if (existing.resetAt <= now) rateLimit.delete(existingKey);
      }
    }
    rateLimit.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count += 1;
  return entry.count > 120;
}

const ensuredDaily = new Set<string>();

async function updateDaily(
  date: string,
  update: Record<string, admin.firestore.FieldValue>,
): Promise<void> {
  const reference = admin.firestore().collection(DAILY_COLLECTION).doc(date);

  if (!ensuredDaily.has(date)) {
    await reference.set(
      { date, createdAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
    ensuredDaily.add(date);
  }

  try {
    await reference.update(update);
  } catch (error) {
    const code = (error as { code?: number | string }).code;
    if (code === 5 || code === "not-found" || code === "NOT_FOUND") {
      ensuredDaily.delete(date);
      await reference.set(
        { date, createdAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );
      await reference.update(update);
      return;
    }
    throw error;
  }
}

function parseBody(body: unknown): TrackPayload | null {
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString("utf8")) as TrackPayload;
    } catch {
      return null;
    }
  }
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as TrackPayload;
    } catch {
      return null;
    }
  }
  if (body && typeof body === "object") return body as TrackPayload;
  return null;
}

/**
 * Le collecteur reçoit du JSON via fetch et du text/plain via sendBeacon.
 * Selon le runtime, le corps peut être déjà parsé, être une chaîne ou un
 * Buffer : on couvre les trois cas et on lit le flux brut en dernier recours.
 */
async function readPayload(req: unknown): Promise<TrackPayload | null> {
  const request = req as {
    body?: unknown;
    rawBody?: Buffer;
    on: (event: string, listener: (chunk?: unknown) => void) => void;
  };
  if (request.body !== undefined) return parseBody(request.body);
  if (request.rawBody) return parseBody(request.rawBody);

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;
    // `finish` a besoin du timer pour l'annuler ; le timer n'est assigné
    // qu'après la déclaration de la fonction.
    // eslint-disable-next-line prefer-const
    let timer: ReturnType<typeof setTimeout>;
    const finish = (value: TrackPayload | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    timer = setTimeout(() => finish(null), 2000);

    request.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      size += buffer.byteLength;
      if (size > MAX_BODY_BYTES) {
        finish(null);
        return;
      }
      chunks.push(buffer);
    });
    request.on("end", () => finish(parseBody(Buffer.concat(chunks).toString("utf8"))));
    request.on("error", () => finish(null));
  });
}

async function recordEvent(payload: TrackPayload, userAgent: string): Promise<void> {
  const type = payload.type === "pageview" ? "pageview" : payload.type === "event" ? "event" : "";
  if (!type) throw new Error("Type d'événement invalide");

  const eventName = type === "event" ? cleanEventName(payload.name) : "";
  if (type === "event" && !eventName) throw new Error("Nom d'événement invalide");

  const path = cleanPath(payload.path);
  if (!path) return;

  const visitorId = cleanId(payload.visitorId);
  const sessionId = cleanId(payload.sessionId);
  if (!visitorId || !sessionId) throw new Error("Identifiants invalides");

  const date = guadeloupeDate();
  const meta = sanitizeMeta(payload.meta);
  const language = cleanString(payload.language, 20) || "inconnu";
  const timezone = cleanString(payload.timezone, 60) || "inconnu";
  const referrer = cleanString(payload.referrer, 300);
  const utmSource = cleanString(payload.utm?.source, 60);
  const parsedAgent = parseUserAgent(userAgent);
  const device = deviceFromViewport(cleanString(payload.viewport, 20), parsedAgent.device);
  const country = countryFromTimezone(timezone, language);
  const source = sourceFrom(referrer, utmSource);
  const visitorKey = hash(visitorId, 16);
  const sessionKey = hash(sessionId, 16);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + RETENTION_DAYS * 86_400_000),
  );

  const eventDoc: Record<string, unknown> = {
    type,
    name: eventName || null,
    path,
    title: cleanString(payload.title, 160) || null,
    referrer: source.referrerHost || null,
    source: source.source,
    device,
    browser: parsedAgent.browser,
    os: parsedAgent.os,
    country,
    language,
    timezone,
    screen: cleanString(payload.screen, 20) || null,
    viewport: cleanString(payload.viewport, 20) || null,
    connection: cleanString(payload.connection, 20) || null,
    visitorKey,
    sessionKey,
    meta,
    date,
    timestamp: now,
    expiresAt,
  };

  if (eventName === "page_leave") {
    eventDoc.dwellMs = meta.dwellMs ?? null;
    eventDoc.maxScroll = meta.maxScroll ?? null;
  }

  const daily: Record<string, admin.firestore.FieldValue> = {};
  const increment = admin.firestore.FieldValue.increment(1);
  const addDimension = (field: string, value: string) => {
    if (value) daily[`${field}.${mapKey(value)}`] = increment;
  };

  if (type === "pageview") {
    daily.pageviews = increment;
    addDimension("paths", path);
    addDimension("devices", device);
    addDimension("browsers", parsedAgent.browser);
    addDimension("os", parsedAgent.os);
    addDimension("countries", country);
    addDimension("languages", language);
  } else {
    daily.events = increment;
    addDimension("eventsByName", eventName);

    const counter = COUNTER_FOR_EVENT[eventName];
    if (counter) daily[counter] = increment;

    if (meta.houseId && (eventName === "listing_view" || eventName === "listing_click")) {
      const houseId = cleanId(meta.houseId);
      if (houseId) {
        addDimension(eventName === "listing_view" ? "houses" : "houseClicks", houseId);
      }
    }
    if (eventName === "search") {
      addDimension("searchesByFilter", String(meta.filters || "aucun"));
    }
    if (eventName === "email_sent" && meta.form) {
      addDimension("emailsByForm", String(meta.form));
    }
    if (eventName === "page_leave") {
      const dwellMs = Number(meta.dwellMs || 0);
      const maxScroll = Number(meta.maxScroll || 0);
      const addValue = (field: string, key: string, value: number) => {
        if (key) daily[`${field}.${mapKey(key)}`] = admin.firestore.FieldValue.increment(value);
      };
      addValue("pathDwell", path, dwellMs);
      addDimension("pathDwellCount", path);
      addValue("pathScroll", path, maxScroll);
      addDimension("pathScrollCount", path);
    }
  }

  if (payload.firstVisitToday === true) {
    const visitorDay = admin.firestore().collection(VISITOR_DAYS_COLLECTION).doc(
      hash(`${date}:${visitorId}`, 32),
    );
    const created = await createIfMissing(visitorDay, { date, createdAt: now, expiresAt });
    if (created) daily.visitors = increment;
  }

  const sessionReference = admin.firestore().collection(SESSIONS_COLLECTION).doc(
    hash(`${date}:${sessionId}`, 32),
  );
  let sessionCreated = false;
  if (payload.newSession === true) {
    sessionCreated = await createIfMissing(sessionReference, {
      date,
      firstSeen: now,
      lastSeen: now,
      pageviews: 0,
      events: 0,
      landingPath: path,
      lastPath: path,
      referrer: source.referrerHost || null,
      source: source.source,
      device,
      browser: parsedAgent.browser,
      os: parsedAgent.os,
      country,
      language,
      formSubmits: 0,
      emailsSent: 0,
      expiresAt,
    });
    if (sessionCreated) {
      daily.sessions = increment;
      // Les sources sont comptées par session (page d'arrivée), pas par page
      // vue : cela évite de surpondérer un référent sur tout le parcours.
      addDimension("sources", source.source);
      if (source.referrerHost) addDimension("referrers", source.referrerHost);
    }
  }

  const sessionUpdate: Record<string, unknown> = {
    date,
    lastSeen: now,
    lastPath: path,
    expiresAt,
    events: admin.firestore.FieldValue.increment(1),
  };
  if (type === "pageview") {
    sessionUpdate.pageviews = admin.firestore.FieldValue.increment(1);
  }
  if (eventName === "form_submit") {
    sessionUpdate.formSubmits = admin.firestore.FieldValue.increment(1);
  }
  if (eventName === "email_sent") {
    sessionUpdate.emailsSent = admin.firestore.FieldValue.increment(1);
  }

  const writes: Array<Promise<unknown>> = [
    admin.firestore().collection(EVENTS_COLLECTION).add(eventDoc),
    updateDaily(date, daily),
    sessionReference.set(sessionUpdate, { merge: true }),
  ];

  if (["form_submit", "email_sent", "email_error"].includes(eventName)) {
    writes.push(
      admin.firestore().collection(SUBMISSIONS_COLLECTION).add({
        type: "event",
        name: eventName,
        path,
        title: cleanString(payload.title, 160) || null,
        source: source.source,
        device,
        browser: parsedAgent.browser,
        os: parsedAgent.os,
        country,
        language,
        meta,
        date,
        timestamp: now,
        expiresAt,
      }),
    );
  }

  const results = await Promise.allSettled(writes);

  for (const result of results) {
    if (result.status === "rejected") {
      logger.warn("Écriture analytics échouée", result.reason);
    }
  }
}

function toMillis(value: unknown): number {
  if (value instanceof admin.firestore.Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (value && typeof value === "object" && "toMillis" in value) {
    const toMillisFn = (value as { toMillis?: () => number }).toMillis;
    if (typeof toMillisFn === "function") return toMillisFn.call(value);
  }
  return 0;
}

function normalizeDaily(date: string, data: admin.firestore.DocumentData | undefined): DailyRow {
  const row: DailyRow = { date };
  for (const field of NUMBER_FIELDS) row[field] = Number(data?.[field] || 0);
  for (const field of MAP_FIELDS) {
    row[field] = (data?.[field] || {}) as Record<string, number>;
  }
  return row;
}

function mergeMap(rows: DailyRow[], field: string): Array<{ key: string; count: number }> {
  const merged = new Map<string, number>();
  for (const row of rows) {
    const map = row[field];
    if (!map || typeof map !== "object") continue;
    for (const [key, value] of Object.entries(map as Record<string, number>)) {
      merged.set(key, (merged.get(key) || 0) + Number(value || 0));
    }
  }
  return [...merged.entries()]
    .map(([key, count]) => ({ key: decodeMapKey(key), count }))
    .sort((a, b) => b.count - a.count);
}

function top(items: Array<{ key: string; count: number }>, limit: number) {
  return items.slice(0, limit);
}

function eventToJson(document: admin.firestore.DocumentData, id: string) {
  return {
    id,
    timestamp: new Date(toMillis(document.timestamp)).toISOString(),
    type: document.type || "event",
    name: document.name || null,
    path: document.path || "",
    title: document.title || "",
    device: document.device || "",
    browser: document.browser || "",
    os: document.os || "",
    country: document.country || "",
    source: document.source || "",
    meta: document.meta || {},
  };
}

function sessionToJson(document: admin.firestore.DocumentData) {
  const firstSeen = toMillis(document.firstSeen);
  const lastSeen = toMillis(document.lastSeen);
  const durationMs =
    firstSeen && lastSeen && lastSeen > firstSeen
      ? Math.min(lastSeen - firstSeen, MAX_SESSION_DURATION_MS)
      : 0;
  return {
    time: new Date(lastSeen || firstSeen).toISOString(),
    durationMs,
    pageviews: Number(document.pageviews || 0),
    events: Number(document.events || 0),
    source: document.source || "",
    device: document.device || "",
    country: document.country || "",
    landingPath: document.landingPath || "",
    lastPath: document.lastPath || "",
    formSubmits: Number(document.formSubmits || 0),
    emailsSent: Number(document.emailsSent || 0),
  };
}

/** Collecteur public appelé par le site. */
export const track = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 10,
    maxInstances: 20,
    cors: true,
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.set("Allow", "POST, OPTIONS");
      res.status(405).json({ error: "Méthode non autorisée" });
      return;
    }

    const contentLength = Number(req.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      res.status(413).json({ error: "Payload trop volumineux" });
      return;
    }

    const forwardedFor = (req.get("x-forwarded-for") || "").split(",")[0].trim();
    if (isRateLimited(forwardedFor || req.ip || "unknown")) {
      res.status(204).send("");
      return;
    }

    const payload = await readPayload(req);
    if (!payload) {
      res.status(400).json({ error: "Payload invalide" });
      return;
    }

    try {
      await recordEvent(payload, req.get("user-agent") || "");
      res.status(204).send("");
    } catch (error) {
      logger.warn("Événement analytics ignoré", error);
      res.status(204).send("");
    }
  },
);

/** API privée du tableau de bord (Firebase ID token obligatoire). */
export const analytics = onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 60,
    maxInstances: 10,
    cors: true,
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "GET") {
      res.set("Allow", "GET, OPTIONS");
      res.status(405).json({ error: "Méthode non autorisée" });
      return;
    }

    const authorization = req.get("authorization") || "";
    const tokenMatch = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!tokenMatch) {
      res.status(401).json({ error: "Authentification requise" });
      return;
    }

    try {
      const decoded = await admin.auth().verifyIdToken(tokenMatch[1]);
      const allowedEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      if (
        allowedEmails.length > 0 &&
        !allowedEmails.includes((decoded.email || "").toLowerCase())
      ) {
        res.status(403).json({ error: "Accès réservé à l'administration" });
        return;
      }

      const requestedDays = Number(String(req.query.days || "30"));
      const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
      const today = guadeloupeDate();
      const dates = Array.from({ length: days }, (_, index) =>
        addDays(today, -(days - 1 - index)),
      );

      const dailyReferences = dates.map((date) =>
        admin.firestore().collection(DAILY_COLLECTION).doc(date),
      );
      const dailyDocuments = await admin.firestore().getAll(...dailyReferences);
      const dailyById = new Map(dailyDocuments.map((document) => [document.id, document]));
      const dailyRows = dates.map((date) => {
        const document = dailyById.get(date);
        return normalizeDaily(date, document?.exists ? document.data() : undefined);
      });

      const totals: Record<string, number> = {};
      for (const field of NUMBER_FIELDS) {
        totals[field] = dailyRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
      }

      const sessionSnapshot = await admin
        .firestore()
        .collection(SESSIONS_COLLECTION)
        .where("date", ">=", dates[0])
        .where("date", "<=", today)
        .limit(5000)
        .get();

      const sessionDocuments = sessionSnapshot.docs.map((document) => document.data());
      const durations = sessionDocuments
        .map((document) => {
          const firstSeen = toMillis(document.firstSeen);
          const lastSeen = toMillis(document.lastSeen);
          if (!firstSeen || !lastSeen || lastSeen <= firstSeen) return 0;
          const duration = lastSeen - firstSeen;
          return duration <= MAX_SESSION_DURATION_MS ? duration : 0;
        })
        .filter((duration) => duration > 0);

      totals.avgSessionMs = durations.length
        ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
        : 0;
      totals.avgPagesPerSession = totals.sessions
        ? totals.pageviews / totals.sessions
        : 0;

      const recentEventsSnapshot = await admin
        .firestore()
        .collection(EVENTS_COLLECTION)
        .orderBy("timestamp", "desc")
        .limit(120)
        .get();

      const recentEvents = recentEventsSnapshot.docs
        .map((document) => eventToJson(document.data(), document.id))
        .filter((event) => event.name !== "page_leave" && event.name !== "scroll_depth")
        .slice(0, 60);

      const recentSessionsSnapshot = await admin
        .firestore()
        .collection(SESSIONS_COLLECTION)
        .orderBy("lastSeen", "desc")
        .limit(20)
        .get();

      const recentSessions = recentSessionsSnapshot.docs.map((document) =>
        sessionToJson(document.data()),
      );

      const recentSubmissionsSnapshot = await admin
        .firestore()
        .collection(SUBMISSIONS_COLLECTION)
        .orderBy("timestamp", "desc")
        .limit(40)
        .get();

      const recentSubmissions = recentSubmissionsSnapshot.docs.map((document) =>
        eventToJson(document.data(), document.id),
      );

      const dwellTotals = mergeMap(dailyRows, "pathDwell");
      const dwellCounts = new Map(
        mergeMap(dailyRows, "pathDwellCount").map((item) => [item.key, item.count]),
      );
      const scrollTotals = new Map(
        mergeMap(dailyRows, "pathScroll").map((item) => [item.key, item.count]),
      );
      const scrollCounts = new Map(
        mergeMap(dailyRows, "pathScrollCount").map((item) => [item.key, item.count]),
      );
      const pageEngagement = dwellTotals
        .map((item) => {
          const samples = dwellCounts.get(item.key) || 0;
          const scrollSamples = scrollCounts.get(item.key) || 0;
          return {
            key: item.key,
            avgDwellMs: samples ? item.count / samples : 0,
            avgScroll: scrollSamples ? (scrollTotals.get(item.key) || 0) / scrollSamples : 0,
            samples,
          };
        })
        .filter((item) => item.samples > 0)
        .sort((a, b) => b.samples - a.samples)
        .slice(0, 20);

      res.set("Cache-Control", "private, no-store");
      res.status(200).json({
        generatedAt: new Date().toISOString(),
        range: { days, from: dates[0], to: today },
        totals,
        daily: dailyRows.map((row) => ({
          date: row.date,
          visitors: row.visitors,
          sessions: row.sessions,
          pageviews: row.pageviews,
          emailsSent: row.emailsSent,
          emailsFailed: row.emailsFailed,
          formSubmits: row.formSubmits,
          whatsappClicks: row.whatsappClicks,
          phoneClicks: row.phoneClicks,
        })),
        pages: top(mergeMap(dailyRows, "paths"), 20),
        houses: top(mergeMap(dailyRows, "houses"), 20),
        houseClicks: top(mergeMap(dailyRows, "houseClicks"), 20),
        sources: top(mergeMap(dailyRows, "sources"), 15),
        referrers: top(mergeMap(dailyRows, "referrers"), 15),
        devices: top(mergeMap(dailyRows, "devices"), 10),
        browsers: top(mergeMap(dailyRows, "browsers"), 10),
        os: top(mergeMap(dailyRows, "os"), 10),
        countries: top(mergeMap(dailyRows, "countries"), 15),
        languages: top(mergeMap(dailyRows, "languages"), 10),
        events: top(mergeMap(dailyRows, "eventsByName"), 30),
        emailsByForm: top(mergeMap(dailyRows, "emailsByForm"), 10),
        searches: top(mergeMap(dailyRows, "searchesByFilter"), 15),
        pageEngagement,
        recentEvents,
        recentSessions,
        recentSubmissions,
      });
    } catch (error) {
      logger.error("Erreur API analytics", error);
      res.status(500).json({ error: "Impossible de charger les statistiques" });
    }
  },
);
