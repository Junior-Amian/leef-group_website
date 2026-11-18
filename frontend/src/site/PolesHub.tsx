import { useEffect, useState, type CSSProperties } from 'react';
import { useReducedMotion } from '../lib/hooks';
import { asset } from '../lib/liens';
import type { Pole } from '../lib/types';

const TAILLE = 520;
const CENTRE = TAILLE / 2;
const RAYON = 190;

/** Position de chaque pôle sur le cercle : répartition régulière, le premier en haut. */
const position = (index: number, total: number) => {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return { x: CENTRE + RAYON * Math.cos(angle), y: CENTRE + RAYON * Math.sin(angle) };
};

/** Schéma du hero : le symbole relié aux pôles ; choisir un pôle trace son lien et affiche son résumé. */
export function PolesHub({ poles }: { poles: Pole[] }) {
  const reduit = useReducedMotion();
  const [actif, setActif] = useState(0);
  const [affiche, setAffiche] = useState(0); // résumé affiché (change après un court fondu)
  const [trace, setTrace] = useState(false);

  useEffect(() => {
    setTrace(false);
    const relance = setTimeout(() => setTrace(true), actif === 0 && !reduit ? 900 : 30);
    const fondu = setTimeout(() => setAffiche(actif), reduit ? 0 : 160);
    return () => {
      clearTimeout(relance);
      clearTimeout(fondu);
    };
  }, [actif, reduit]);

  const cible = position(actif, poles.length);
  const pole = poles[affiche] ?? poles[0];

  return (
    <>
      <div className={`relative mx-auto aspect-square w-full max-w-[330px] sm:max-w-[460px] ${reduit ? '' : 'hub-in'}`} role="group" aria-label="Les pôles de LEEF GROUP : choisissez-en un pour le découvrir">
        <svg viewBox={`0 0 ${TAILLE} ${TAILLE}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx={CENTRE} cy={CENTRE} r={RAYON} fill="none" stroke="rgb(255 255 255 / .3)" strokeWidth="1" />
          <circle cx={CENTRE} cy={CENTRE} r="112" fill="#fff" opacity=".08" />
          {poles.map((_, i) => {
            const { x, y } = position(i, poles.length);
            return <line key={i} className="lien-hub" style={{ '--i': i } as CSSProperties} x1={CENTRE} y1={CENTRE} x2={x} y2={y} />;
          })}
          <line className="lien-actif" data-trace={trace} x1={CENTRE} y1={CENTRE} x2={cible.x} y2={cible.y} />
        </svg>
        <div className="absolute left-1/2 top-1/2 grid aspect-square w-[28%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[0_24px_48px_-20px_rgb(70_0_8/.65)]">
          <img src={asset('leef-symbole.png')} alt="" className="w-[54%]" />
        </div>
        {poles.map((p, i) => {
          const { x, y } = position(i, poles.length);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActif(i)}
              aria-pressed={i === actif}
              aria-label={p.nom}
              className="noeud absolute w-[17%] -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(x / TAILLE) * 100}%`, top: `${(y / TAILLE) * 100}%`, '--i': i } as CSSProperties}
            >
              <span className="noeud-rond grid aspect-square w-full place-items-center rounded-full bg-white">
                <img src={asset(`pole-${p.slug}.png`)} alt="" className="w-1/2" />
              </span>
            </button>
          );
        })}
      </div>

      <div
        aria-live="polite"
        data-change={affiche !== actif}
        className="hub-info hero-in mx-auto mt-5 flex max-w-[460px] items-center gap-4 rounded-2xl bg-white p-4 text-navy shadow-[0_24px_48px_-24px_rgb(70_0_8/.6)] sm:p-5"
        style={{ '--d': '700ms' } as CSSProperties}
      >
        <img src={asset(`pole-${pole.slug}.png`)} alt="" className="h-11 w-11 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold leading-tight">{pole.nom}</p>
          <p className="mt-0.5 text-sm leading-snug text-encre">{pole.resume}</p>
        </div>
      </div>
    </>
  );
}
