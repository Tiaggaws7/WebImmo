import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/** Dossier des miniatures produites par le script de migration des annonces. */
const MIGRATED_THUMBNAILS_DIR = "houses/thumbnails/migrated-houses/";
/** `<dossier>/<nom>-<timestamp>.<ext>` (le timestamp vient de `Date.now()`). */
const STORAGE_FILE_PATTERN = /^(.*)\/(.+?)-(\d{10,})\.([A-Za-z0-9]+)$/;
const TIMESTAMP_PATTERN = /-(\d{10,})(?:\.[A-Za-z0-9]+)?$/;

/** Chemin du fichier depuis une URL de téléchargement Firebase Storage. */
function storagePath(url: string): string | null {
  if (!url) return null;
  const marker = "/o/";
  const start = url.indexOf(marker);
  if (start === -1) return null;
  const end = url.indexOf("?", start);
  const encoded = url.slice(start + marker.length, end === -1 ? undefined : end);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

function fileTimestamp(path: string): number | null {
  const match = TIMESTAMP_PATTERN.exec(path);
  return match ? Number(match[1]) : null;
}

/** Nom de fichier comparable : sans timestamp, sans extension, sans accent ni séparateur. */
function comparableName(path: string): string {
  const fileName = path.slice(path.lastIndexOf("/") + 1);
  return fileName
    .replace(TIMESTAMP_PATTERN, "")
    .replace(/(\.[A-Za-z0-9]+)+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Chemin de la miniature générée pour une image par le panneau d'administration. */
function expectedThumbnailPath(imagePath: string): string | null {
  const match = STORAGE_FILE_PATTERN.exec(imagePath);
  if (!match) return null;
  const [, directory, baseName, timestamp] = match;
  return `${directory}/thumbnails/${baseName}-${timestamp}.jpeg`;
}

/**
 * Vérifie qu'une miniature est bien la version légère de `imageUrl`.
 * Même logique que `src/lib/coverImage.ts` côté site : `thumbnailImage` n'est
 * jamais rafraîchi quand la photo d'accroche change, il ne faut donc pas
 * l'utiliser à l'aveugle.
 */
function isThumbnailOf(thumbnailUrl: string, imageUrl: string): boolean {
  if (!thumbnailUrl || !imageUrl) return false;
  const thumbnailPath = storagePath(thumbnailUrl);
  const imagePath = storagePath(imageUrl);
  if (!thumbnailPath || !imagePath) return false;

  if (expectedThumbnailPath(imagePath) === thumbnailPath) return true;
  if (!thumbnailPath.startsWith(MIGRATED_THUMBNAILS_DIR)) return false;

  const imageTimestamp = fileTimestamp(imagePath);
  const thumbnailTimestamp = fileTimestamp(thumbnailPath);
  return (
    imageTimestamp !== null &&
    thumbnailTimestamp !== null &&
    imageTimestamp <= thumbnailTimestamp &&
    comparableName(thumbnailPath) === comparableName(imagePath)
  );
}

/** Champs d'une annonce utilisés pour choisir la photo d'accroche. */
type HouseCoverData = {
  images?: unknown;
  principalImage?: unknown;
  thumbnailImage?: unknown;
};

/** Photo d'accroche : toujours une photo du bien, en miniature quand elle est fiable. */
function coverImageOf(houseData: HouseCoverData | undefined): string {
  const rawImages = houseData?.images;
  const images: string[] = Array.isArray(rawImages)
    ? rawImages.filter((image): image is string => typeof image === "string" && image !== "")
    : [];
  const rawPrincipalImage = houseData?.principalImage;
  const principalImage = typeof rawPrincipalImage === "string" ? rawPrincipalImage : "";
  const rawThumbnailImage = houseData?.thumbnailImage;
  const thumbnailImage = typeof rawThumbnailImage === "string" ? rawThumbnailImage : "";

  const coverImage =
    principalImage && (images.length === 0 || images.includes(principalImage))
      ? principalImage
      : images[0] || principalImage;

  if (!coverImage) return "";
  return thumbnailImage && isThumbnailOf(thumbnailImage, coverImage) ? thumbnailImage : coverImage;
}

/**
 * SSR / Prerender endpoint pour les pages de détails de maisons (/house/:id)
 * Intercepte les requêtes (surtout des robots WhatsApp/FB pour l'Open Graph),
 * va chercher les vraies infos dans Firestore, injecte les balises <meta> 
 * dans le HTML brut, et renvoie la page pour un "Rich Link Preview" parfait.
 */
export const renderHouseMeta = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (req, res) => {
    logger.log(`📱 Demande d'aperçu de lien pour: ${req.path}`);

    // Extrait l'ID de la maison depuis le path (ex: /house/ID123)
    const pathSegments = req.path.split("/").filter(Boolean);
    const houseId = pathSegments[1];

    if (!houseId) {
      res.status(404).send("Maison non trouvée");
      return;
    }

    try {
      // 1. Lire la maison dans Firestore
      const houseDoc = await db.collection("houses").doc(houseId).get();

      // 2. Récupérer le HTML "coquille vide" de base (index.html) depuis le site en ligne
      // Cela évite de devoir copier le dossier dist/ dans la Cloud Function.
      const siteUrl = "https://elisebuilimmobilierguadeloupe.com";
      const response = await fetch(`${siteUrl}/index.html`);
      let html = await response.text();

      if (houseDoc.exists) {
        const houseData = houseDoc.data();

        // Sécuriser les champs et préparer les variables
        const title = houseData?.title ? `${houseData.title} | Immobilier Guadeloupe` : "Propriété | Immobilier Guadeloupe";
        const price = houseData?.price || "";
        const size = houseData?.size || "";
        const location = houseData?.location || "";
        const description = `À vendre ${location} : ${size}m², ${price}. Découvrez tous les détails et photos !`;
        // SÉCURITÉ WHATSAPP: on cible d'abord la miniature <280Ko, sinon fallback sur la grosse image.
        // `coverImageOf` garantit que la photo choisie fait bien partie de l'annonce
        // (`thumbnailImage` peut être resté bloqué sur une ancienne photo).
        const rawImageUrl = coverImageOf(houseData) || `${siteUrl}/assets/profile_picture.jpg`;

        // L'URL de Firebase Storage est DÉJÀ encodée (avec des %2F et des tokens).
        // Il ne faut surtout pas faire de encodeURI() sinon ça va double-encoder les % en %25 et casser le lien !
        const isAbsolute = rawImageUrl.startsWith("http");
        const safeImageUrl = isAbsolute ? rawImageUrl : `${siteUrl}${rawImageUrl}`;

        const urlObj = `${siteUrl}${req.path}`;

        // 3. Injecter ou Remplacer la balise <title>
        html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);

        // 4. Forcer la balise og:image par défaut à être remplacée
        html = html.replace(/<meta property="?og:image"?.*?>/, `<meta property="og:image" content="${safeImageUrl}" />`);

        // 5. Ajouter les autres balises Open Graph essentielles juste avant la fermeture </head>
        const ogTags = `
    <!-- Balises Open Graph dynamiques injectées par Cloud Function -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${safeImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${urlObj}" />
    
    <!-- Carte Twitter (X) -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${safeImageUrl}" />
  `;
        html = html.replace("</head>", `${ogTags}\n  </head>`);
      }

      // Envoi du HTML au robot/navigateur
      // Cache-control pour éviter de lancer la fonction à chaque fois : cache CDN 1h.
      res.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
      res.status(200).send(html);

    } catch (error) {
      logger.error("❌ Erreur pendant le rendu meta:", error);

      // Fallback de sécurité : on essaie quand même d'afficher l'index.html vierge
      try {
        const response = await fetch("https://elisebuilimmobilierguadeloupe.com/index.html");
        res.status(200).send(await response.text());
      } catch (fallbackError) {
        logger.error(fallbackError);
        res.status(500).send("Erreur serveur");
      }
    }
  }
);