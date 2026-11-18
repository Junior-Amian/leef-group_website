import { useEffect, useState, type RefObject } from 'react';

/** Préférence système « réduire les animations ». */
export function useReducedMotion(): boolean {
  const [reduit, setReduit] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const requete = matchMedia('(prefers-reduced-motion: reduce)');
    const surChangement = () => setReduit(requete.matches);
    requete.addEventListener('change', surChangement);
    return () => requete.removeEventListener('change', surChangement);
  }, []);
  return reduit;
}

/** Vrai tant que l'élément observé croise la fenêtre (avec la marge donnée). */
export function useInView(ref: RefObject<Element>, options: IntersectionObserverInit = {}): boolean {
  const [visible, setVisible] = useState(false);
  const { rootMargin, threshold } = options;
  useEffect(() => {
    if (!ref.current) return;
    const observateur = new IntersectionObserver(([entree]) => setVisible(entree.isIntersecting), { rootMargin, threshold });
    observateur.observe(ref.current);
    return () => observateur.disconnect();
  }, [ref, rootMargin, threshold]);
  return visible;
}
