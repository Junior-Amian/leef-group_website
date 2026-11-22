import type { CSSProperties } from 'react';
import { ArrowDown } from '@phosphor-icons/react';
import { asset } from '../lib/liens';
import type { Parametres, Pole } from '../lib/types';
import { PolesHub } from './PolesHub';

/** Délai d'entrée (ms) : variable CSS --d lue par les animations de index.css. */
const delai = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

export function Hero({ p, poles }: { p: Parametres; poles: Pole[] }) {
  return (
    <section id="accueil" className="sur-sombre relative overflow-hidden bg-rouge text-white">
      <img src={asset('leef-symbole-blanc.png')} alt="" aria-hidden="true" className="filigrane pointer-events-none absolute -bottom-40 -left-40 w-[560px] opacity-[.08]" />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-4 pb-14 pt-32 sm:px-6 lg:min-h-[min(100dvh,58rem)] lg:grid-cols-12 lg:gap-10 lg:px-10 lg:pb-20 lg:pt-36">
        {/* Centré tant que le hero est sur une colonne (mobile, tablette) ; aligné à gauche à côté du schéma. */}
        <div className="text-center lg:col-span-7 lg:text-left">
          <h1 className="font-display text-[3.4rem] font-black leading-[.92] tracking-[-0.04em] sm:text-[5.5rem] lg:text-[7rem]">
            {/* Le titre principal dit aussi qui est le groupe et où (lu par les moteurs et les lecteurs d'écran), sans changer le visuel. */}
            <span className="sr-only">LEEF GROUP, groupe multisectoriel à Abidjan : </span>
            {/* Slogan officiel (non éditable) : chaque verbe entre avec un geste qui illustre son sens (voir index.css).
                Les espaces entre les mots sont invisibles (les mots sont des blocs) mais indispensables au texte lu. */}
            <span className="verbe joint" style={delai(0)}><span>Conne</span><span>cter</span></span>{' '}
            <span className="mot"><span style={delai(260)}>Structurer</span></span>{' '}
            <span className="verbe"><span className="elan" style={delai(520)}>Performer</span></span>
          </h1>
          <p className="hero-in mx-auto mt-8 max-w-[30rem] text-lg lg:mx-0 leading-relaxed text-white sm:text-xl" style={delai(700)}>
            {p['hero.description']}
          </p>
          <div className="hero-in mt-9" style={delai(800)}>
            <a href="#poles" className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-white px-6 font-bold text-rouge transition-transform active:scale-[.97] sm:inline-flex sm:w-auto">
              Découvrir nos pôles <ArrowDown size={18} aria-hidden />
            </a>
          </div>
        </div>
        <div className="lg:col-span-5">{poles.length > 0 && <PolesHub poles={poles} />}</div>
      </div>
    </section>
  );
}
