import { useEffect, useState } from 'react';
import { EnvelopeSimple, Phone, WhatsappLogo } from '@phosphor-icons/react';
import { asset, lienEmail, lienTelephone, lienWhatsApp } from '../lib/liens';
import type { Parametres } from '../lib/types';
import { RUBRIQUES } from './sections';

/** Barre de navigation flottante, menu mobile avec voile et suivi de la rubrique en cours. */
export function Navbar({ p }: { p: Parametres }) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const defile = useSortieDuHero();
  const rubriqueActive = useRubriqueActive();

  useEffect(() => {
    if (!menuOuvert) return;
    const fermer = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOuvert(false);
    document.addEventListener('keydown', fermer);
    document.documentElement.classList.add('overflow-hidden');
    return () => {
      document.removeEventListener('keydown', fermer);
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, [menuOuvert]);

  const fermerMenu = () => setMenuOuvert(false);

  return (
    <>
      <header className="entete fixed inset-x-0 top-0 z-40" data-defile={defile}>
        <div className="ilot mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between rounded-full bg-white pl-5 pr-2 ring-1 ring-navy/5 sm:pl-7 lg:h-20 lg:pr-3">
          <a href="#accueil" className="flex h-14 items-center" aria-label="LEEF GROUP, retour à l’accueil">
            <img src={asset('leef-logo.png')} alt="LEEF GROUP" className="h-11 w-auto sm:h-12 lg:h-14" width={1295} height={510} />
          </a>
          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-1 text-[15px] font-semibold text-encre">
              {RUBRIQUES.map((r) => (
                <li key={r.id}>
                  <a
                    href={`#${r.id}`}
                    aria-current={rubriqueActive === r.id ? 'true' : undefined}
                    className="lien-nav rounded-full px-4 py-2.5 transition-colors hover:bg-perle hover:text-navy"
                  >
                    {r.libelle}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <a href="#contact" className="hidden h-14 items-center rounded-full bg-navy px-6 text-[15px] font-bold text-white transition-[background-color,transform] hover:bg-navy-800 active:scale-[.97] sm:inline-flex">
              Nous contacter
            </a>
            <button
              type="button"
              onClick={() => setMenuOuvert((o) => !o)}
              aria-controls="menu-mobile"
              aria-expanded={menuOuvert}
              aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="relative h-14 w-14 rounded-full bg-perle transition-transform active:scale-95 lg:hidden"
            >
              <span className="trait trait-1 absolute left-1/2 top-[24px] h-[2px] w-5 rounded-full bg-navy" aria-hidden="true" />
              <span className="trait trait-2 absolute left-1/2 top-[31px] h-[2px] w-5 rounded-full bg-navy" aria-hidden="true" />
            </button>
          </div>
        </div>

        {menuOuvert && (
          <div id="menu-mobile" className="menu-mobile mx-auto mt-2 max-w-6xl rounded-[28px] bg-white p-3 shadow-[0_24px_48px_-20px_rgb(0_19_78/.4)] ring-1 ring-navy/5 lg:hidden">
            <ul className="text-lg font-semibold">
              {RUBRIQUES.map((r) => (
                <li key={r.id}>
                  <a href={`#${r.id}`} onClick={fermerMenu} className="block rounded-2xl px-4 py-3.5 hover:bg-perle">{r.libelle}</a>
                </li>
              ))}
              <li>
                <a href="#contact" onClick={fermerMenu} className="mt-2 block rounded-full bg-navy px-4 py-3.5 text-center text-white">Nous contacter</a>
              </li>
            </ul>
            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-ligne px-1 pt-3 text-sm font-bold">
              <a href={lienTelephone(p['contact.telephone'])} className="flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl hover:bg-perle">
                <Phone size={20} aria-hidden />Appeler
              </a>
              <a href={lienWhatsApp(p['contact.whatsapp'])} target="_blank" rel="noopener" className="flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl hover:bg-perle">
                <WhatsappLogo size={20} aria-hidden />WhatsApp
              </a>
              <a href={lienEmail(p['contact.email'])} className="flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl hover:bg-perle">
                <EnvelopeSimple size={20} aria-hidden />E-mail
              </a>
            </div>
          </div>
        )}
      </header>

      {menuOuvert && <div className="fixed inset-0 z-30 bg-navy/40 lg:hidden" onClick={fermerMenu} aria-hidden="true" />}
    </>
  );
}

/** Vrai dès que le hero n'est plus sous la barre de navigation. */
function useSortieDuHero(): boolean {
  const [sorti, setSorti] = useState(false);
  useEffect(() => {
    const hero = document.getElementById('accueil');
    if (!hero) return;
    const observateur = new IntersectionObserver(([e]) => setSorti(!e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' });
    observateur.observe(hero);
    return () => observateur.disconnect();
  }, []);
  return sorti;
}

/** Identifiant de la section qui occupe le milieu de l'écran. */
function useRubriqueActive(): string {
  const [active, setActive] = useState('');
  useEffect(() => {
    const observateur = new IntersectionObserver(
      (entrees) => entrees.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    ['accueil', ...RUBRIQUES.map((r) => r.id), 'contact'].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observateur.observe(section);
    });
    return () => observateur.disconnect();
  }, []);
  return active;
}
