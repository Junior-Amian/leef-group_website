import type { CSSProperties } from 'react';
import { ArrowDown } from '@phosphor-icons/react';
import { asset } from '../lib/liens';
import type { Parametres, Pole } from '../lib/types';
import { PolesHub } from './PolesHub';

/** Slogan officiel (identité du groupe, non éditable). */
const SLOGAN = ['Connecter', 'Structurer', 'Performer'];

export function Hero({ p, poles }: { p: Parametres; poles: Pole[] }) {
  return (
    <section id="accueil" className="sur-sombre relative overflow-hidden bg-rouge text-white">
      <img src={asset('leef-symbole-blanc.png')} alt="" aria-hidden="true" className="filigrane pointer-events-none absolute -bottom-40 -left-40 w-[560px] opacity-[.08]" />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 px-4 pb-14 pt-32 sm:px-6 lg:min-h-[min(100dvh,58rem)] lg:grid-cols-12 lg:gap-10 lg:px-10 lg:pb-20 lg:pt-36">
        <div className="lg:col-span-7">
          <h1 className="font-display text-[3.4rem] font-black leading-[.92] tracking-[-0.04em] sm:text-[5.5rem] lg:text-[7rem]">
            {SLOGAN.map((mot, i) => (
              <span key={mot} className="mot">
                <span style={{ '--d': `${i * 110}ms` } as CSSProperties}>{mot}</span>
              </span>
            ))}
          </h1>
          <p className="hero-in mt-8 max-w-[30rem] text-lg leading-relaxed text-white sm:text-xl" style={{ '--d': '420ms' } as CSSProperties}>
            {p['hero.description']}
          </p>
          <div className="hero-in mt-9" style={{ '--d': '500ms' } as CSSProperties}>
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
