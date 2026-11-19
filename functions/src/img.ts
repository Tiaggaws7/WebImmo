import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import sharp from "sharp";

/**
 * Redimensionnement / conversion à la volée des photos Firebase Storage.
 *
 * Firebase Storage ne sait pas transformer les images (contrairement à
 * Contentful avec `?fm=avif&w=…&q=…`) et sert les fichiers d'origine, parfois
 * 1,4 Mo, avec `Cache-Control: private, max-age=0`. Cette fonction reproduit le
 * même contrat que l'API d'images de Contentful :
 *
 *   /api/img?p=<chemin Storage>&w=<largeur>&fm=avif|webp|jpeg&q=<qualité>
 *
 * La réponse est servie avec un cache immuable d'un an : le CDN de Firebase
 * Hosting ne la calcule donc qu'une seule fois par variante. Les noms de
 * fichiers contiennent un timestamp (`…-1712345678901`), une photo remplacée
 * obtient donc une nouvelle URL et jamais un cache périmé.
 */

const BUCKET = "webimmo-6189a.firebasestorage.app";
/** Seuls ces dossiers sont publics sur le site : rien d'autre n'est servi. */
const ALLOWED_PREFIXES = ["houses/", "settings/"];
/** Largeurs autorisées : évite qu'on puisse générer des variantes à l'infini. */
const ALLOWED_WIDTHS = [160, 320, 480, 640, 800, 960, 1280, 1600, 2000, 2400];
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

type Format = "avif" | "webp" | "jpeg";
const FORMATS: Format[] = ["avif", "webp", "jpeg"];
const DEFAULT_QUALITY: Record<Format, number> = { avif: 60, webp: 80, jpeg: 82 };

export function parseParams(query: Record<string, unknown>): {
  path: string;
  width: number;
  format: Format;
  quality: number;
} | null {
  const path = typeof query.p === "string" ? query.p : "";
  if (
    !path ||
    path.length > 300 ||
    path.includes("..") ||
    !ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))
  ) {
    return null;
  }

  const width = Number(query.w);
  if (!ALLOWED_WIDTHS.includes(width)) return null;

  const format = (typeof query.fm === "string" ? query.fm : "webp") as Format;
  if (!FORMATS.includes(format)) return null;

  const requested = Number(query.q);
  const quality =
    Number.isInteger(requested) && requested >= 30 && requested <= 95 ?
      requested :
      DEFAULT_QUALITY[format];

  return { path, width, format, quality };
}

export async function transform(
  source: Buffer,
  width: number,
  format: Format,
  quality: number,
): Promise<Buffer> {
  const pipeline = sharp(source, { failOn: "none" })
    .rotate()
    .resize({ width, withoutEnlargement: true });

  switch (format) {
  case "avif":
    return pipeline.avif({ quality, effort: 4 }).toBuffer();
  case "jpeg":
    return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
  default:
    return pipeline.webp({ quality, effort: 4 }).toBuffer();
  }
}

const CONTENT_TYPES: Record<Format, string> = {
  avif: "image/avif",
  webp: "image/webp",
  jpeg: "image/jpeg",
};

export const img = onRequest(
  { region: "us-central1", memory: "512MiB", timeoutSeconds: 30, cors: false },
  async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).send("Method not allowed");
      return;
    }

    const params = parseParams(req.query as Record<string, unknown>);
    if (!params) {
      res.status(400).send("Paramètres invalides");
      return;
    }

    try {
      const url =
        `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/` +
        `${encodeURIComponent(params.path)}?alt=media`;
      const upstream = await fetch(url);
      if (!upstream.ok) {
        res.status(upstream.status === 404 ? 404 : 502).send("Image introuvable");
        return;
      }

      const source = Buffer.from(await upstream.arrayBuffer());
      if (source.length > MAX_SOURCE_BYTES) {
        res.status(413).send("Image trop volumineuse");
        return;
      }

      const output = await transform(source, params.width, params.format, params.quality);
      res.set({
        "Content-Type": CONTENT_TYPES[params.format],
        // `s-maxage` : cache du CDN Firebase Hosting ; `immutable` : navigateur.
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      });
      res.status(200).send(output);
    } catch (error) {
      logger.error("img: échec de la transformation", { path: params.path, error });
      res.status(500).send("Erreur de traitement");
    }
  },
);
