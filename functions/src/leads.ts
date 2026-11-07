import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Capture des demandes (leads) AVANT l'envoi EmailJS.
 *
 * Le formulaire appelle `submitLead`, puis EmailJS, puis `updateLeadStatus`.
 * Si EmailJS échoue, la demande est tout de même visible dans /Gestion.
 *
 * Les données sont stockées uniquement côté serveur (SDK Admin) : les règles
 * Firestore doivent interdire tout accès client à la collection `leads`.
 */

const LEADS_COLLECTION = "leads";
const MAX_BODY_BYTES = 32 * 1024;
const LIST_LIMIT = 500;
const HASH_SALT =
  process.env.LEADS_HASH_SALT ||
  process.env.ANALYTICS_HASH_SALT ||
  "webimmo-leads-v1";

const ALLOWED_TYPES = new Set(["estimation", "vendre", "contact"]);
const ALLOWED_STATUSES = new Set(["email_sent", "email_error"]);

const ALLOWED_DATA_KEYS = new Set([
  "address",
  "propertyType",
  "livingArea",
  "landArea",
  "floors",
  "rooms",
  "bedrooms",
  "constructionPeriod",
  "condition",
  "features",
  "saleTimeline",
  "gender",
  "firstName",
  "lastName",
  "name",
  "surname",
  "project",
  "availability",
  "message",
]);

const LONG_TEXT_KEYS = new Set(["address", "project", "availability", "message"]);

type LeadPayload = {
  submissionId?: unknown;
  type?: unknown;
  contact?: unknown;
  data?: unknown;
  pagePath?: unknown;
  source?: unknown;
  website?: unknown;
  token?: unknown;
  id?: unknown;
  status?: unknown;
  error?: unknown;
};

type SanitizedLead = {
  type: string;
  contact: { name: string; email: string; phone: string };
  data: Record<string, string | number | boolean | string[]>;
  pagePath: string;
  source: string;
};

function cleanString(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  let cleaned = "";
  for (const character of value) {
    const code = character.codePointAt(0) || 0;
    cleaned += code < 32 || code === 127 ? " " : character;
  }
  return cleaned.trim().slice(0, maxLength);
}

function cleanEmail(value: unknown): string {
  const email = cleanString(value, 160).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : "";
}

function cleanPhone(value: unknown): string {
  return cleanString(value, 40);
}

function cleanId(value: unknown): string {
  const id = cleanString(value, 80);
  return /^[A-Za-z0-9_-]{8,80}$/.test(id) ? id : "";
}

function cleanPath(value: unknown): string {
  let path = cleanString(value, 200);
  if (!path) return "";
  if (!path.startsWith("/")) path = `/${path}`;
  return path.split(/[?#]/)[0].slice(0, 200);
}

function hash(value: string): string {
  return createHash("sha256").update(`${HASH_SALT}:${value}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

function parseBody(body: unknown): LeadPayload | null {
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString("utf8")) as LeadPayload;
    } catch {
      return null;
    }
  }
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as LeadPayload;
    } catch {
      return null;
    }
  }
  if (body && typeof body === "object") return body as LeadPayload;
  return null;
}

async function readPayload(req: unknown): Promise<LeadPayload | null> {
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
    // eslint-disable-next-line prefer-const
    let timer: ReturnType<typeof setTimeout>;
    const finish = (value: LeadPayload | null) => {
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

function sanitizeContact(value: unknown): { name: string; email: string; phone: string } {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    name: cleanString(raw.name, 160),
    email: cleanEmail(raw.email),
    phone: cleanPhone(raw.phone),
  };
}

function sanitizeData(value: unknown): Record<string, string | number | boolean | string[]> {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const clean: Record<string, string | number | boolean | string[]> = {};

  for (const [key, item] of Object.entries(raw)) {
    if (!ALLOWED_DATA_KEYS.has(key) || item === undefined || item === null) continue;

    if (Array.isArray(item)) {
      clean[key] = item
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => cleanString(entry, 120))
        .filter(Boolean)
        .slice(0, 30);
      continue;
    }

    if (typeof item === "string") {
      const maxLength = LONG_TEXT_KEYS.has(key) ? 2000 : 160;
      const text = cleanString(item, maxLength);
      if (text) clean[key] = text;
      continue;
    }

    if (typeof item === "number" && Number.isFinite(item)) {
      clean[key] = item;
      continue;
    }

    if (typeof item === "boolean") {
      clean[key] = item;
    }
  }

  return clean;
}

function sanitizeLead(payload: LeadPayload): SanitizedLead | null {
  const type = cleanString(payload.type, 20).toLowerCase();
  if (!ALLOWED_TYPES.has(type)) return null;

  const contact = sanitizeContact(payload.contact);
  if (!contact.email && !contact.phone) return null;
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email)) return null;

  const data = sanitizeData(payload.data);

  return {
    type,
    contact,
    data,
    pagePath: cleanPath(payload.pagePath),
    source: cleanString(payload.source, 120),
  };
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (value && typeof value === "object" && "toDate" in value) {
    const toDate = (value as { toDate?: () => Date }).toDate;
    if (typeof toDate === "function") return toDate.call(value).toISOString();
  }
  return null;
}

function leadToJson(id: string, document: admin.firestore.DocumentData) {
  return {
    id,
    type: document.type || "contact",
    status: document.status || "new",
    createdAt: toIso(document.createdAt),
    updatedAt: toIso(document.updatedAt),
    emailSentAt: toIso(document.emailSentAt),
    emailError: document.emailError || null,
    pagePath: document.pagePath || "",
    source: document.source || "",
    contact: document.contact || {},
    data: document.data || {},
  };
}

/**
 * Limite simple en mémoire : protège contre le spam de demandes.
 * La clé est un hash de l'IP, jamais l'IP en clair.
 */
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(clientKey: string, limit = 30): boolean {
  if (!clientKey || clientKey === "unknown") return false;
  const key = hash(clientKey).slice(0, 24);
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
  return entry.count > limit;
}

function clientKey(req: {
  get(name: string): string | undefined;
  ip?: string;
}): string {
  const forwardedFor = (req.get("x-forwarded-for") || "").split(",")[0].trim();
  return forwardedFor || req.ip || "unknown";
}

/** Enregistre une demande avant l'envoi de l'email. */
export const submitLead = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 15,
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
    if (isRateLimited(clientKey(req))) {
      res.status(429).json({ error: "Trop de demandes, réessayez plus tard." });
      return;
    }

    const payload = await readPayload(req);
    if (!payload) {
      res.status(400).json({ error: "Payload invalide" });
      return;
    }

    // Champ piège rempli par les robots : on répond OK sans rien stocker.
    if (cleanString(payload.website, 200)) {
      res.status(200).json({ skipped: true });
      return;
    }

    const lead = sanitizeLead(payload);
    if (!lead) {
      res.status(400).json({ error: "Demande invalide" });
      return;
    }

    const submissionId =
      cleanId(payload.submissionId) || randomBytes(12).toString("hex");
    const token = randomBytes(32).toString("hex");
    const tokenHash = hash(token);
    const now = admin.firestore.FieldValue.serverTimestamp();
    const reference = admin.firestore().collection(LEADS_COLLECTION).doc(submissionId);

    try {
      const existing = await reference.get();
      if (existing.exists) {
        await reference.set(
          {
            contact: lead.contact,
            data: lead.data,
            pagePath: lead.pagePath,
            source: lead.source,
            tokenHash,
            updatedAt: now,
          },
          { merge: true },
        );
      } else {
        await reference.set({
          type: lead.type,
          status: "new",
          contact: lead.contact,
          data: lead.data,
          pagePath: lead.pagePath,
          source: lead.source,
          tokenHash,
          createdAt: now,
          updatedAt: now,
        });
      }

      res.status(200).json({ id: submissionId, token });
    } catch (error) {
      logger.error("Erreur d'enregistrement de la demande", error);
      res.status(500).json({ error: "Impossible d'enregistrer la demande" });
    }
  },
);

/** Met à jour le statut d'envoi EmailJS (appelé après l'envoi). */
export const updateLeadStatus = onRequest(
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

    if (isRateLimited(clientKey(req), 60)) {
      res.status(429).json({ error: "Trop de requêtes." });
      return;
    }

    const payload = await readPayload(req);
    if (!payload) {
      res.status(400).json({ error: "Payload invalide" });
      return;
    }

    const id = cleanId(payload.id);
    const token = cleanString(payload.token, 200);
    const status = cleanString(payload.status, 20);
    if (!id || !token || !ALLOWED_STATUSES.has(status)) {
      res.status(400).json({ error: "Paramètres invalides" });
      return;
    }

    try {
      const reference = admin.firestore().collection(LEADS_COLLECTION).doc(id);
      const snapshot = await reference.get();
      if (!snapshot.exists) {
        res.status(404).json({ error: "Demande introuvable" });
        return;
      }

      const expectedHash = String(snapshot.get("tokenHash") || "");
      if (!safeEqual(expectedHash, hash(token))) {
        res.status(403).json({ error: "Jeton invalide" });
        return;
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const update: Record<string, unknown> = {
        status,
        updatedAt: now,
      };

      if (status === "email_sent") {
        update.emailSentAt = now;
        update.emailError = admin.firestore.FieldValue.delete();
      } else {
        update.emailError = cleanString(payload.error, 500) || "Erreur EmailJS";
      }

      await reference.update(update);
      res.status(204).send("");
    } catch (error) {
      logger.error("Erreur de mise à jour du statut de la demande", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

/** Liste privée des demandes pour l'administration. */
export const leads = onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 30,
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

      const requestedDays = String(req.query.days || "90");
      const parsedDays = requestedDays === "all" ? 0 : Number(requestedDays);
      const safeDays =
        requestedDays === "all"
          ? 0
          : Number.isFinite(parsedDays) && parsedDays > 0
            ? Math.min(parsedDays, 3650)
            : 90;

      let query: admin.firestore.Query = admin.firestore().collection(LEADS_COLLECTION);
      if (safeDays > 0) {
        query = query.where(
          "createdAt",
          ">=",
          admin.firestore.Timestamp.fromDate(
            new Date(Date.now() - safeDays * 86_400_000),
          ),
        );
      }

      const snapshot = await query
        .orderBy("createdAt", "desc")
        .limit(LIST_LIMIT)
        .get();

      const leadsList = snapshot.docs.map((document) =>
        leadToJson(document.id, document.data()),
      );

      res.set("Cache-Control", "private, no-store");
      res.status(200).json({
        count: leadsList.length,
        days: safeDays || "all",
        leads: leadsList,
      });
    } catch (error) {
      logger.error("Erreur de lecture des demandes", error);
      res.status(500).json({ error: "Impossible de charger les demandes" });
    }
  },
);
