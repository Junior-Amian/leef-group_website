import { Link } from 'react-router-dom';
import { FacebookLogo, InstagramLogo, LinkedinLogo, type Icon } from '@phosphor-icons/react';
import { asset, lienPole } from '../lib/liens';
import type { Parametres, Pole } from '../lib/types';

const RESEAUX: { cle: string; nom: string; Icone: Icon }[] = [
  { cle: 'reseaux.linkedin', nom: 'LinkedIn', Icone: LinkedinLogo },
  { cle: 'reseaux.facebook', nom: 'Facebook', Icone: FacebookLogo },
  { cle: 'reseaux.instagram', nom: 'Instagram', Icone: InstagramLogo },
];

const PASTILLE = 'grid h-14 w-14 place-items-center rounded-2xl bg-white text-navy ring-1 ring-ligne';

export function Footer({ p, poles }: { p: Parametres; poles: Pole[] }) {
  return (
    <footer className="bg-perle">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 pb-28 pt-14 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-10 lg:py-16">
        <div>
          <img src={asset('leef-logo.png')} alt="LEEF GROUP" loading="lazy" width={1295} height={510} className="h-16 w-auto sm:h-20" />
          <p className="mt-6 font-display text-lg font-bold sm:text-xl">{p['pied.accroche']}</p>
        </div>
        {/* Liens vers la page de chaque pôle : navigation directe et maillage interne pour le référencement. */}
        <nav aria-label="Nos pôles">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-1 text-[15px] font-semibold">
            {poles.map((pole) => (
              <li key={pole.id}>
                <Link {...lienPole(pole)} className="inline-flex min-h-11 items-center text-encre underline-offset-4 hover:text-navy hover:underline">
                  {pole.nom}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Réseaux sociaux">
          <ul className="flex gap-3">
            {RESEAUX.map(({ cle, nom, Icone }) => (
              <li key={cle}>
                {/* Tant que l'adresse n'est pas renseignée dans le panel, le pictogramme s'affiche sans lien. */}
                {p[cle] ? (
                  <a href={p[cle]} target="_blank" rel="noopener" aria-label={nom} className={`${PASTILLE} transition-[background-color,color,transform] hover:bg-navy hover:text-white active:scale-95`}>
                    <Icone size={24} aria-hidden />
                  </a>
                ) : (
                  <span role="img" aria-label={nom} className={PASTILLE}>
                    <Icone size={24} aria-hidden />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
