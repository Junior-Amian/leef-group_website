import type { CSSProperties } from 'react';
import { ArrowsInCardinal, Stack, TrendUp, type Icon } from '@phosphor-icons/react';
import type { Parametres } from '../lib/types';

/** Les trois verbes du slogan ; seule leur description est éditable. */
const VALEURS: { titre: string; cle: string; Icone: Icon }[] = [
  { titre: 'Connecter', cle: 'valeurs.connecter', Icone: ArrowsInCardinal },
  { titre: 'Structurer', cle: 'valeurs.structurer', Icone: Stack },
  { titre: 'Performer', cle: 'valeurs.performer', Icone: TrendUp },
];

export function Groupe({ p }: { p: Parametres }) {
  return (
    <section id="groupe" className="py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7" data-reveal>
            <h2 className="max-w-[20ch] text-balance font-display text-4xl font-black leading-[1] tracking-[-0.035em] sm:text-6xl">{p['groupe.titre']}</h2>
            <p className="mt-7 max-w-[60ch] text-lg leading-relaxed text-encre">{p['groupe.texte']}</p>
          </div>
          <figure className="self-end rounded-[28px] bg-perle p-7 sm:p-10 lg:col-span-5" data-reveal style={{ '--d': '120ms' } as CSSProperties}>
            <span className="block font-display text-7xl font-black leading-[.6] text-rouge" aria-hidden="true">“</span>
            <blockquote className="mt-2 font-display text-xl font-semibold leading-snug sm:text-2xl">{p['groupe.vision']}</blockquote>
            <figcaption className="mt-5 text-encre">Notre vision</figcaption>
          </figure>
        </div>

        <ul className="mt-16 grid gap-10 border-t border-ligne pt-10 sm:grid-cols-3 sm:gap-8 lg:mt-20" data-reveal>
          {VALEURS.map(({ titre, cle, Icone }) => (
            <li key={cle} className="flex gap-4 sm:block">
              <Icone size={36} weight="light" className="shrink-0 text-rouge" aria-hidden />
              <div className="sm:mt-5">
                <p className="font-display text-2xl font-extrabold tracking-[-0.02em]">{titre}</p>
                <p className="mt-1.5 leading-relaxed text-encre">{p[cle]}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
