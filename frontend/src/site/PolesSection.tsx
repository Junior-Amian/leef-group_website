import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { useReducedMotion } from '../lib/hooks';
import { asset } from '../lib/liens';
import type { Parametres, Pole } from '../lib/types';
import { PhotoPole } from '../shared/PhotoPole';
import { PoleSheet } from './PoleSheet';

/** Cartes des pôles qui s'empilent au défilement ; chaque carte ouvre la fiche détaillée du pôle. */
export function PolesSection({ p, poles }: { p: Parametres; poles: Pole[] }) {
  const [poleOuvert, setPoleOuvert] = useState<Pole | null>(null);
  const listeRef = useRef<HTMLOListElement>(null);
  useStackDepth(listeRef);

  return (
    <section id="poles" className="bg-perle py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl" data-reveal>
          <h2 className="font-display text-4xl font-black leading-[1] tracking-[-0.035em] sm:text-6xl">{p['poles.titre']}</h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-encre">{p['poles.texte']}</p>
        </div>

        <ol ref={listeRef} id="liste-poles" className="mt-10 space-y-8 sm:space-y-12 lg:mt-14 lg:space-y-28">
          {poles.map((pole, i) => (
            <li key={pole.id} id={`pole-${pole.slug}`} className="carte-pole" style={{ '--i': i } as CSSProperties}>
              <PoleCard pole={pole} onOpen={() => setPoleOuvert(pole)} />
            </li>
          ))}
        </ol>
      </div>

      <PoleSheet pole={poleOuvert} p={p} onClose={() => setPoleOuvert(null)} />
    </section>
  );
}

function PoleCard({ pole, onOpen }: { pole: Pole; onOpen: () => void }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_60px_-40px_rgb(0_19_78/.45)] ring-1 ring-ligne lg:grid lg:h-[30rem] lg:grid-cols-2">
      <span className="voile-carte pointer-events-none absolute inset-0 z-20 rounded-[28px] bg-navy" aria-hidden="true" />
      <div className="flex flex-1 flex-col p-5 sm:p-10 lg:p-12">
        <div className="flex items-center gap-3 sm:block">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-perle sm:block sm:h-auto sm:w-auto sm:place-items-start sm:bg-transparent">
            <img src={asset(`pole-${pole.slug}.png`)} alt="" className="h-8 w-8 object-contain sm:h-12 sm:w-12 sm:object-left" />
          </span>
          <h3 className="font-display text-[1.45rem] font-extrabold leading-tight tracking-[-0.025em] sm:mt-6 sm:text-4xl">{pole.nom}</h3>
        </div>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-encre sm:mt-4 sm:text-base">{pole.accroche}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5 text-sm font-medium sm:mt-6 sm:gap-2">
          {pole.prestations.map((s) => (
            <li key={s.titre} className="rounded-full bg-perle px-2.5 py-1 sm:px-3 sm:py-1.5">{s.libelleCourt}</li>
          ))}
        </ul>
        <div className="mt-auto pt-5 sm:pt-8">
          {/* after:inset-0 + z-10 : toute la carte est cliquable (même la photo agrandie au survol), le bouton reste la cible sémantique.
              Pas d'effet d'appui (scale) ici : un transform rétracterait la zone ::after pendant le clic et l'annulerait. */}
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 font-bold text-white transition-colors after:absolute after:inset-0 after:z-10 after:rounded-[28px] hover:bg-navy-800 group-hover:bg-navy-800 sm:w-auto sm:justify-start"
          >
            Voir les {pole.prestations.length} prestations
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
          </button>
        </div>
      </div>
      <div className="order-first h-36 overflow-hidden bg-perle sm:h-60 lg:order-none lg:h-full">
        <div className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(.23,1,.32,1)] group-hover:scale-[1.04]">
          <PhotoPole pole={pole} className="h-full w-full" />
        </div>
      </div>
    </article>
  );
}

/**
 * Pendant que la carte suivante monte, la carte recouverte recule (variable --p de 0 à 1, voir index.css).
 * Calcul limité à une fois par image, et seulement quand la liste est à l'écran.
 */
function useStackDepth(listeRef: React.RefObject<HTMLOListElement>) {
  const reduit = useReducedMotion();
  useEffect(() => {
    const liste = listeRef.current;
    if (reduit || !liste) return;
    const cartes = [...liste.children] as HTMLElement[];
    let hauts: number[] = [];
    let image = 0;
    let visible = false;

    const mesurer = () => { hauts = cartes.map((c) => parseFloat(getComputedStyle(c).top)); };
    const mettreAJour = () => {
      image = 0;
      const depart = innerHeight * 0.85; // l'effet commence quand la carte suivante entre franchement
      cartes.forEach((carte, i) => {
        const suivante = cartes[i + 1];
        const progres = suivante
          ? Math.min(1, Math.max(0, (depart - suivante.getBoundingClientRect().top) / (depart - hauts[i + 1])))
          : 0;
        (carte.firstElementChild as HTMLElement).style.setProperty('--p', progres.toFixed(3));
      });
    };
    const demander = () => { if (visible && !image) image = requestAnimationFrame(mettreAJour); };
    const redimensionner = () => { mesurer(); demander(); };

    mesurer();
    const observateur = new IntersectionObserver(([e]) => { visible = e.isIntersecting; demander(); });
    observateur.observe(liste);
    addEventListener('scroll', demander, { passive: true });
    addEventListener('resize', redimensionner);
    return () => {
      observateur.disconnect();
      removeEventListener('scroll', demander);
      removeEventListener('resize', redimensionner);
      cancelAnimationFrame(image);
    };
  }, [listeRef, reduit]);
}
