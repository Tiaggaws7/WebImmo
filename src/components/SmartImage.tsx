import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { IMAGE_WIDTHS, optimizedSrcSet, optimizedUrl, storagePathOf } from '../lib/imageUrl';

type SmartImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'srcSet' | 'sizes'> & {
  src: string;
  alt: string;
  /** Largeur d'affichage réelle (même syntaxe que l'attribut `sizes`). */
  sizes: string;
  /** Largeurs générées ; par défaut toutes les largeurs de `/api/img`. */
  widths?: readonly number[];
};

/**
 * Image responsive AVIF → WebP → original pour les photos Firebase Storage.
 *
 * - `<picture className="contents">` : le navigateur choisit AVIF s'il le supporte, sinon WebP, et
 *   la bonne largeur d'après `sizes` (aucun octet de trop sur mobile).
 * - Repli automatique sur l'URL d'origine si `/api/img` répond une erreur
 *   (fonction non déployée, indisponible, photo introuvable) : l'image
 *   s'affiche toujours.
 * - Les images qui ne viennent pas de Firebase Storage restent de simples <img>.
 */
export default function SmartImage({
  src,
  alt,
  sizes,
  widths = IMAGE_WIDTHS,
  onError,
  ...rest
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);
  const path = storagePathOf(src);

  if (!path || failed) {
    return <img src={src} alt={alt} onError={onError} {...rest} />;
  }

  // Largeur intermédiaire : valeur de repli pour les navigateurs sans `srcset`.
  const fallbackWidth = widths[Math.min(2, widths.length - 1)];

  return (
    <picture className="contents">
      <source type="image/avif" srcSet={optimizedSrcSet(path, 'avif', widths)} sizes={sizes} />
      <img
        src={optimizedUrl(path, fallbackWidth, 'webp')}
        srcSet={optimizedSrcSet(path, 'webp', widths)}
        sizes={sizes}
        alt={alt}
        onError={() => setFailed(true)}
        {...rest}
      />
    </picture>
  );
}
