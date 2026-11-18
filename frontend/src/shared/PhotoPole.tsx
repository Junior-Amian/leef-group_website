import { useState } from 'react';
import { asset } from '../lib/liens';
import type { Pole } from '../lib/types';

type Props = {
  pole: Pick<Pole, 'slug' | 'nom' | 'image' | 'imageAlt'>;
  /** Classes de l'image ou du placeholder (taille, coins, effets). */
  className?: string;
  /** Mention sous le pictogramme ; masquée sur les petites vignettes. */
  mention?: boolean;
  loading?: 'lazy' | 'eager';
};

/**
 * Photo d'un pôle, ou placeholder aux couleurs du groupe tant qu'aucune photo n'a été ajoutée
 * depuis le panel (fond gris perle tramé, pictogramme officiel, mention « Photo à venir »).
 * Une photo qui ne se charge pas retombe aussi sur le placeholder.
 */
export function PhotoPole({ pole, className = '', mention = true, loading = 'lazy' }: Props) {
  const [enErreur, setEnErreur] = useState(false);
  const [chargee, setChargee] = useState(false);

  if (pole.image && !enErreur) {
    return (
      <img
        src={pole.image}
        alt={pole.imageAlt}
        loading={loading}
        onLoad={() => setChargee(true)}
        onError={() => setEnErreur(true)}
        className={`object-cover transition-opacity duration-300 ${chargee ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${pole.nom} : photo à venir`}
      className={`grid place-items-center bg-perle bg-[repeating-linear-gradient(135deg,rgb(0_19_78/.035)_0_12px,transparent_12px_24px)] ${className}`}
    >
      <div className="flex flex-col items-center gap-3 p-4 text-center">
        <span className="grid aspect-square w-14 place-items-center rounded-full bg-white shadow-[0_10px_24px_-14px_rgb(0_19_78/.45)] sm:w-20">
          <img src={asset(`pole-${pole.slug}.png`)} alt="" className="w-1/2" />
        </span>
        {mention && <span className="text-sm font-medium text-encre">Photo à venir</span>}
      </div>
    </div>
  );
}
