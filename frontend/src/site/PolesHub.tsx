import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from '../lib/hooks';
import { asset } from '../lib/liens';
import type { Pole } from '../lib/types';

const TAILLE = 520;
const CENTRE = TAILLE / 2;
const RAYON = 190;
/** Durée d'affichage d'un pôle pendant la visite automatique. */
const INTERVALLE = 4500;

/** Position de chaque pôle sur le cercle : répartition régulière, le premier en haut. */
const position = (index: number, total: number) => {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return { x: CENTRE + RAYON * Math.cos(angle), y: CENTRE + RAYON * Math.sin(angle) };
};

/**
 * Schéma du hero : le symbole relié aux pôles ; choisir un pôle trace son lien et affiche son résumé.
 * Tant que le visiteur n'a pas choisi de pôle, le schéma les présente tour à tour (visite automatique),
 * en pause au survol, au focus, hors écran ou onglet masqué. Aucun mouvement continu si le mouvement est réduit.
 */
export function PolesHub({ poles }: { poles: Pole[] }) {
  const reduit = useReducedMotion();
  const racine = useRef<HTMLDivElement>(null);
  const premierTrace = useRef(true);
  const [actif, setActif] = useState(0);
  const [affiche, setAffiche] = useState(0); // résumé affiché (change après un court fondu)
  const [trace, setTrace] = useState(false);
  const [manuel, setManuel] = useState(false); // le visiteur a choisi un pôle : la visite automatique s'arrête
  const [survol, setSurvol] = useState(false);
  const [aLEcran, setALEcran] = useState(true);
  const [ongletVisible, setOngletVisible] = useState(true);

  useEffect(() => {
    setTrace(false);
    // Au premier affichage, le lien attend la fin de l'entrée du schéma.
    const delai = premierTrace.current && !reduit ? 900 : 30;
    premierTrace.current = false;
    const relance = setTimeout(() => setTrace(true), delai);
    const fondu = setTimeout(() => setAffiche(actif), reduit ? 0 : 160);
    return () => {
      clearTimeout(relance);
      clearTimeout(fondu);
    };
  }, [actif, reduit]);

  useEffect(() => {
    const el = racine.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observateur = new IntersectionObserver(([entree]) => setALEcran(entree.isIntersecting));
    observateur.observe(el);
    const surVisibilite = () => setOngletVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', surVisibilite);
    return () => {
      observateur.disconnect();
      document.removeEventListener('visibilitychange', surVisibilite);
    };
  }, []);

  const visite = !reduit && !manuel && !survol && aLEcran && ongletVisible && poles.length > 1;

  useEffect(() => {
    if (!visite) return;
    const suivant = setTimeout(() => setActif((i) => (i + 1) % poles.length), INTERVALLE);
    return () => clearTimeout(suivant);
  }, [visite, actif, poles.length]);

  const choisir = (i: number) => {
    setManuel(true);
    setActif(i);
  };

  const cible = position(actif, poles.length);
  const pole = poles[affiche] ?? poles[0];

  return (
    <>
      <div
        ref={racine}
        className={`relative mx-auto aspect-square w-full max-w-[330px] sm:max-w-[460px] ${reduit ? '' : 'hub-in hub-vivant'}`}
        role="group"
        aria-label="Les pôles de LEEF GROUP : choisissez-en un pour le découvrir"
        onMouseEnter={() => setSurvol(true)}
        onMouseLeave={() => setSurvol(false)}
        onFocus={() => setSurvol(true)}
        onBlur={() => setSurvol(false)}
      >
        <svg viewBox={`0 0 ${TAILLE} ${TAILLE}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <g className="orbite-lente">
            <circle cx={CENTRE} cy={CENTRE} r="248" fill="none" stroke="rgb(255 255 255 / .14)" strokeWidth="1" strokeDasharray="1 9" strokeLinecap="round" />
          </g>
          <g className="orbite">
            <circle cx={CENTRE} cy={CENTRE} r={RAYON} fill="none" stroke="rgb(255 255 255 / .3)" strokeWidth="1" />
            {!reduit && <circle cx={CENTRE} cy={CENTRE - RAYON} r="3.5" fill="#fff" opacity=".85" transform={`rotate(32 ${CENTRE} ${CENTRE})`} />}
          </g>
          <circle cx={CENTRE} cy={CENTRE} r="112" fill="#fff" opacity=".08" />
          {poles.map((_, i) => {
            const { x, y } = position(i, poles.length);
            return <line key={i} className="lien-hub" style={{ '--i': i } as CSSProperties} x1={CENTRE} y1={CENTRE} x2={x} y2={y} />;
          })}
          <line className="lien-actif" data-trace={trace} x1={CENTRE} y1={CENTRE} x2={cible.x} y2={cible.y} />
          {/* Impulsions : un point lumineux part du symbole vers chaque pôle (sauf le lien actif, déjà tracé). */}
          {!reduit &&
            poles.map((_, i) => {
              if (i === actif) return null;
              const { x, y } = position(i, poles.length);
              return (
                <circle key={i} r="3" fill="#fff" opacity="0">
                  <animateMotion dur="2.8s" begin={`${1.2 + i * 0.45}s`} repeatCount="indefinite" path={`M${CENTRE},${CENTRE} L${x},${y}`} calcMode="spline" keyTimes="0;1" keySplines=".45 0 .25 1" />
                  <animate attributeName="opacity" dur="2.8s" begin={`${1.2 + i * 0.45}s`} repeatCount="indefinite" values="0;.9;.9;0" keyTimes="0;.2;.75;1" />
                </circle>
              );
            })}
        </svg>
        {!reduit &&
          [0, 1].map((n) => (
            <span
              key={n}
              aria-hidden="true"
              className="halo pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[28%] rounded-full border border-white/50"
              style={{ '--d': `${n * 1800}ms` } as CSSProperties}
            />
          ))}
        <div className="absolute left-1/2 top-1/2 grid aspect-square w-[28%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[0_24px_48px_-20px_rgb(70_0_8/.65)]">
          <img src={asset('leef-symbole.png')} alt="" className="w-[54%]" />
        </div>
        {poles.map((p, i) => {
          const { x, y } = position(i, poles.length);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => choisir(i)}
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
        aria-live={manuel ? 'polite' : 'off'}
        data-change={affiche !== actif}
        className="hub-info hero-in relative mx-auto mt-5 flex max-w-[460px] items-center gap-4 overflow-hidden rounded-2xl bg-white p-4 text-navy shadow-[0_24px_48px_-24px_rgb(70_0_8/.6)] sm:p-5"
        style={{ '--d': '700ms' } as CSSProperties}
      >
        <img src={asset(`pole-${pole.slug}.png`)} alt="" className="h-11 w-11 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold leading-tight">{pole.nom}</p>
          <p className="mt-0.5 text-sm leading-snug text-encre">{pole.resume}</p>
        </div>
        {visite && (
          <span
            key={actif}
            aria-hidden="true"
            className="progression absolute inset-x-0 bottom-0 h-[3px] bg-rouge/70"
            style={{ '--duree': `${INTERVALLE}ms` } as CSSProperties}
          />
        )}
      </div>
    </>
  );
}
