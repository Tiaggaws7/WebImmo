import type { House } from '../types';

/**
 * Photo d'accroche des cartes d'annonces.
 *
 * Un bien stocke trois choses côté Firestore :
 *  - `images` : la galerie réellement affichée sur la fiche du bien,
 *  - `principalImage` : l'image principale choisie dans la galerie,
 *  - `thumbnailImage` : un cache léger de la photo d'accroche.
 *
 * Problème historique : `thumbnailImage` n'était écrit qu'au premier
 * téléversement puis n'était plus jamais rafraîchi. Il n'apparaît ni sur la fiche
 * du bien (qui n'utilise que `images`) ni dans le panneau d'administration :
 * quand la photo d'accroche était remplacée ou supprimée, les cartes
 * continuaient donc d'afficher une ancienne photo — parfois la photo d'un autre
 * bien — introuvable partout ailleurs sur le site.
 *
 * `getListingCoverImage` garantit que la carte n'affiche qu'une photo qui fait
 * partie de l'annonce, et n'utilise la miniature allégée que si elle correspond
 * réellement à cette photo.
 */

type ListingImages = Pick<House, 'images' | 'principalImage' | 'thumbnailImage'>;

/** Dossier des miniatures produites par le script de migration des annonces. */
const MIGRATED_THUMBNAILS_DIR = 'houses/thumbnails/migrated-houses/';

/** `<dossier>/<nom>-<timestamp>.<ext>` (le timestamp vient de `Date.now()`). */
const STORAGE_FILE_PATTERN = /^(.*)\/(.+?)-(\d{10,})\.([A-Za-z0-9]+)$/;
const TIMESTAMP_PATTERN = /-(\d{10,})(?:\.[A-Za-z0-9]+)?$/;

/** Extrait le chemin du fichier depuis une URL de téléchargement Firebase Storage. */
function storagePath(url: string): string | null {
  if (!url) return null;
  const marker = '/o/';
  const start = url.indexOf(marker);
  if (start === -1) return null;
  const end = url.indexOf('?', start);
  const encoded = url.slice(start + marker.length, end === -1 ? undefined : end);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

/** Numéro du timestamp présent dans le nom du fichier (`1712345678901`). */
function fileTimestamp(path: string): number | null {
  const match = TIMESTAMP_PATTERN.exec(path);
  return match ? Number(match[1]) : null;
}

/** Nom de fichier comparable : sans timestamp, sans extension, sans accent ni séparateur. */
function comparableName(path: string): string {
  const fileName = path.slice(path.lastIndexOf('/') + 1);
  return fileName
    .replace(TIMESTAMP_PATTERN, '')
    .replace(/(\.[A-Za-z0-9]+)+$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Chemin de la miniature générée pour une image par le panneau d'administration. */
function expectedThumbnailPath(imagePath: string): string | null {
  const match = STORAGE_FILE_PATTERN.exec(imagePath);
  if (!match) return null;
  const [, directory, baseName, timestamp] = match;
  return `${directory}/thumbnails/${baseName}-${timestamp}.jpeg`;
}

/**
 * Vérifie qu'une miniature est bien la version légère de `imageUrl` :
 *  - mêmes nom et timestamp pour les envois du panneau d'administration ;
 *  - même nom normalisé pour les miniatures de la migration, à condition qu'elles
 *    soient postérieures à l'image (une image téléversée après la migration ne
 *    peut pas avoir été utilisée pour générer cette miniature).
 */
export function isThumbnailOf(thumbnailUrl: string, imageUrl: string): boolean {
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

/**
 * Photo à afficher sur la carte d'une annonce : toujours une photo du bien,
 * en version allégée quand la miniature correspond bien à l'image principale.
 */
export function getListingCoverImage(house: ListingImages): string {
  // `images` vient de Firestore : on ne suppose pas que c'est toujours un tableau.
  const images = Array.isArray(house.images) ? house.images.filter((image) => !!image) : [];
  const principalImage = house.principalImage || '';
  const thumbnailImage = house.thumbnailImage || '';

  // L'image principale n'est retenue que si elle fait toujours partie de la galerie.
  const coverImage =
    principalImage && (images.length === 0 || images.includes(principalImage))
      ? principalImage
      : images[0] || principalImage;

  if (!coverImage) return '';
  return thumbnailImage && isThumbnailOf(thumbnailImage, coverImage) ? thumbnailImage : coverImage;
}
