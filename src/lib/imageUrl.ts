/**
 * URLs d'images optimisées.
 *
 * Les photos des annonces vivent dans Firebase Storage, qui ne sait ni
 * redimensionner ni convertir et les sert en `private, max-age=0` (jusqu'à
 * 1,4 Mo en JPEG pour une carte de 400 px). La fonction `/api/img` (voir
 * `functions/src/img.ts`) reprend le contrat de l'API d'images de Contentful :
 * `?w=` largeur, `?fm=` format, `?q=` qualité, avec un cache immuable d'un an.
 *
 * Les URL qui ne viennent pas de Firebase Storage (images locales, autre CDN)
 * sont renvoyées telles quelles.
 */

export type ImageFormat = 'avif' | 'webp' | 'jpeg';

/** Doit rester identique à `ALLOWED_WIDTHS` dans `functions/src/img.ts`. */
export const IMAGE_WIDTHS = [320, 480, 640, 800, 960, 1280, 1600, 2000] as const;

const STORAGE_URL = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?#]+)/;

/** Chemin Storage (`houses/…`) d'une URL de téléchargement, ou `null`. */
export function storagePathOf(url: string): string | null {
  const match = STORAGE_URL.exec(url);
  if (!match) return null;
  try {
    const path = decodeURIComponent(match[1]);
    // Seuls ces dossiers sont servis par `/api/img`.
    return path.startsWith('houses/') || path.startsWith('settings/') ? path : null;
  } catch {
    return null;
  }
}

export function optimizedUrl(path: string, width: number, format: ImageFormat, quality?: number): string {
  const params = new URLSearchParams({ p: path, w: String(width), fm: format });
  if (quality) params.set('q', String(quality));
  return `/api/img?${params.toString()}`;
}

/** `srcset` d'un format pour les largeurs demandées. */
export function optimizedSrcSet(
  path: string,
  format: ImageFormat,
  widths: readonly number[] = IMAGE_WIDTHS,
): string {
  return widths.map((width) => `${optimizedUrl(path, width, format)} ${width}w`).join(', ');
}
