import { useCallback, useEffect, useState } from 'react';
import { useLocation, useMatch } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { signalerPageVue } from '../lib/audience';
import type { SiteContent } from '../lib/types';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { Groupe } from './Groupe';
import { PolesSection } from './PolesSection';
import { Partenariat } from './Partenariat';
import { Contact } from './Contact';
import { Footer } from './Footer';
import { ActionBar } from './ActionBar';
import { PageIntrouvable } from './PageIntrouvable';

/**
 * Site public. Le contenu est injecté par le serveur (window.__SITE__) ;
 * à défaut (développement, base momentanément indisponible), il est chargé via l'API.
 * Sur /poles/{slug}, la fiche du pôle est ouverte par-dessus l'accueil.
 */
export function SitePage() {
  const [content, setContent] = useState<SiteContent | null>(() => window.__SITE__ ?? null);
  const [erreur, setErreur] = useState('');
  const slug = useMatch('/poles/:slug')?.params.slug;
  const poleOuvert = (slug && content?.poles.find((pole) => pole.slug === slug)) || null;

  const charger = useCallback(() => {
    setErreur('');
    api<SiteContent>('/site')
      .then(setContent)
      .catch((e: ApiError) => setErreur(e.message));
  }, []);

  useEffect(() => {
    if (!content) charger();
  }, [content, charger]);

  // Même format que le titre posé par le serveur (backend/app/Services/Seo.php).
  useEffect(() => {
    if (!content) return;
    document.title = poleOuvert
      ? `${poleOuvert.nom} à Abidjan | LEEF GROUP`
      : content.parametres['seo.titre'] || 'LEEF GROUP';
  }, [content, poleOuvert]);

  // Page vue comptée une fois la page affichée (accueil ou fiche d'un pôle existant).
  const pageAffichee = content !== null && !(slug && !poleOuvert);
  const { pathname } = useLocation();
  useEffect(() => {
    if (pageAffichee) signalerPageVue(pathname);
  }, [pageAffichee, pathname]);

  useRevealOnScroll(content !== null);

  if (!content) {
    return (
      <main className="grid min-h-dvh place-items-center bg-rouge px-6 text-center text-white">
        {erreur ? (
          <div role="alert">
            <p className="font-display text-2xl font-bold">Le site n’a pas pu se charger.</p>
            <p className="mt-2 text-white/85">{erreur}</p>
            <button type="button" onClick={charger} className="mt-6 h-12 rounded-xl bg-white px-6 font-bold text-rouge">
              Réessayer
            </button>
          </div>
        ) : (
          <p aria-live="polite">Chargement…</p>
        )}
      </main>
    );
  }

  if (slug && !poleOuvert) return <PageIntrouvable />; // pôle inconnu ou désactivé

  const { parametres: p, poles } = content;
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
        Aller au contenu
      </a>
      <Navbar p={p} />
      <main id="contenu">
        <Hero p={p} poles={poles} />
        <Groupe p={p} />
        <PolesSection p={p} poles={poles} poleOuvert={poleOuvert} />
        <Partenariat p={p} poles={poles} />
        <Contact p={p} />
      </main>
      <Footer p={p} poles={poles} />
      <ActionBar p={p} />
    </>
  );
}

/** Fait apparaître les blocs [data-reveal] quand ils entrent dans la fenêtre (une seule fois). */
function useRevealOnScroll(actif: boolean) {
  useEffect(() => {
    if (!actif) return;
    const elements = document.querySelectorAll('[data-reveal]');
    const observateur = new IntersectionObserver(
      (entrees) => entrees.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        observateur.unobserve(e.target);
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    elements.forEach((el) => observateur.observe(el));
    return () => observateur.disconnect();
  }, [actif]);
}
