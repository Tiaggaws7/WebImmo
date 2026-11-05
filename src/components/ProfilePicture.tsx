import profilePicture400 from '../assets/profile_picture-400.webp';
import profilePicture800 from '../assets/profile_picture.jpg';

type ProfilePictureProps = {
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Photo d'Elise BUIL en version responsive.
 *
 * La variante 400 px est un WebP haute qualité (q90).
 * Au-delà, on sert le JPEG d'origine (800 px, 57 Ko) : c'est la source
 * d'origine, donc aucune dégradation visible par rapport à l'ancien site.
 */
export default function ProfilePicture({
  className = '',
  sizes = '(min-width: 1024px) 400px, 90vw',
  priority = false,
}: ProfilePictureProps) {
  return (
    <img
      src={profilePicture800}
      srcSet={`${profilePicture400} 400w, ${profilePicture800} 800w`}
      sizes={sizes}
      width={800}
      height={1199}
      alt="Elise BUIL"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  );
}
