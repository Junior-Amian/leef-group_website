import { useEffect, useRef, useState } from 'react';
import { Phone, WhatsappLogo } from '@phosphor-icons/react';
import { lienTelephone, lienWhatsApp } from '../lib/liens';
import type { Parametres } from '../lib/types';

/**
 * Contact rapide (mobile). Visible hors du hero, masquée sur la pile des pôles (elle cacherait
 * le bouton de la carte collée), sur la section contact et pendant la saisie d'un formulaire.
 * Le voile du menu et la fiche modale la recouvrent d'eux-mêmes (calque supérieur).
 */
export function ActionBar({ p }: { p: Parametres }) {
  const visible = useActionBarVisible();
  const ref = useRef<HTMLElement>(null);
  // Barre masquée = hors de portée du clavier et des lecteurs d'écran (inert n'est pas géré par React 18).
  useEffect(() => { if (ref.current) ref.current.inert = !visible; }, [visible]);
  return (
    <nav
      ref={ref}
      aria-label="Contact rapide"
      data-visible={visible}
      className="barre-action fixed inset-x-3 z-20 grid grid-cols-2 gap-2 rounded-2xl bg-navy p-2 shadow-[0_20px_40px_-12px_rgb(0_19_78/.55)] ring-1 ring-white/20 lg:hidden"
    >
      <a href={lienTelephone(p['contact.telephone'])} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white/10 font-bold text-white transition-transform active:scale-[.97]">
        <Phone size={20} aria-hidden />Appeler
      </a>
      <a href={lienWhatsApp(p['contact.whatsapp'])} target="_blank" rel="noopener" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-rouge font-bold text-white transition-transform active:scale-[.97]">
        <WhatsappLogo size={20} aria-hidden />WhatsApp
      </a>
    </nav>
  );
}

function useActionBarVisible(): boolean {
  const [masques, setMasques] = useState({ hero: true, poles: false, contact: false, saisie: false });

  useEffect(() => {
    const suivre = (id: string, cle: keyof typeof masques, options: IntersectionObserverInit) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const o = new IntersectionObserver(([e]) => setMasques((m) => ({ ...m, [cle]: e.isIntersecting })), options);
      o.observe(el);
      return o;
    };
    const observateurs = [
      suivre('accueil', 'hero', {}),
      suivre('liste-poles', 'poles', { rootMargin: '-30% 0px -30% 0px' }),
      suivre('contact', 'contact', { threshold: 0.1 }),
    ];
    const enSaisie = (e: FocusEvent) => (e.target as Element).closest?.('form') && setMasques((m) => ({ ...m, saisie: e.type === 'focusin' }));
    document.addEventListener('focusin', enSaisie);
    document.addEventListener('focusout', enSaisie);
    return () => {
      observateurs.forEach((o) => o?.disconnect());
      document.removeEventListener('focusin', enSaisie);
      document.removeEventListener('focusout', enSaisie);
    };
  }, []);

  return !Object.values(masques).some(Boolean);
}
