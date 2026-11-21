import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CheckCircle, Phone, WhatsappLogo, X } from '@phosphor-icons/react';
import { useReducedMotion } from '../lib/hooks';
import { asset, lienTelephone, lienWhatsApp } from '../lib/liens';
import type { Parametres, Pole } from '../lib/types';
import { PhotoPole } from '../shared/PhotoPole';

const DUREE_FERMETURE = 200;

/**
 * Fiche détaillée d'un pôle (dialog natif : focus piégé, Échap, fond inerte).
 * Ordinateur : fenêtre centrée. Mobile : panneau du bas, qu'on peut glisser vers le bas pour fermer.
 */
export function PoleSheet({ pole, p, onClose }: { pole: Pole | null; p: Parametres; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const defilRef = useRef<HTMLDivElement>(null);
  const reduit = useReducedMotion();
  const [ferme, setFerme] = useState(false);
  const [ombre, setOmbre] = useState(false);

  // Ouverture : affichage modal, page bloquée, contenu remis en haut.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!pole || !dialog) return;
    const declencheur = document.activeElement as HTMLElement | null;
    setFerme(false);
    dialog.showModal();
    defilRef.current?.scrollTo(0, 0);
    majOmbre();
    document.documentElement.classList.add('overflow-hidden');
    return () => {
      document.documentElement.classList.remove('overflow-hidden');
      declencheur?.focus({ preventScroll: true });
    };
  }, [pole]);

  // Fiche fermée par l'adresse (bouton Retour du navigateur) : le dialog encore ouvert doit l'être aussi.
  useEffect(() => {
    if (!pole && dialogRef.current?.open) dialogRef.current.close();
  }, [pole]);

  const fermer = () => {
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    if (reduit) {
      dialog.close();
      return;
    }
    setFerme(true); // animation de sortie, plus courte que l'entrée
    setTimeout(() => dialog.close(), DUREE_FERMETURE);
  };

  const majOmbre = () => {
    const el = defilRef.current;
    if (el) setOmbre(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  };

  const glisser = useSwipeToClose(dialogRef, defilRef, () => dialogRef.current?.close());

  if (!pole) return <dialog ref={dialogRef} className="fiche" />;

  const messageWhatsApp = `Bonjour LEEF GROUP, je souhaite des informations sur le pôle ${pole.nom}.`;

  return (
    <dialog
      ref={dialogRef}
      className="fiche"
      aria-labelledby="fiche-titre"
      data-ferme={ferme}
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); fermer(); }}
      onClick={(e) => e.target === e.currentTarget && fermer()}
    >
      <button type="button" onClick={fermer} aria-label="Fermer la fiche" className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/95 text-navy shadow-[0_8px_20px_-8px_rgb(0_19_78/.5)] transition-transform active:scale-95 sm:right-4 sm:top-4">
        <X size={20} aria-hidden />
      </button>

      <div ref={defilRef} onScroll={majOmbre} className="fiche-defil">
        <div className="fiche-tete relative bg-perle" {...glisser}>
          <PhotoPole key={pole.id} pole={pole} loading="eager" className="h-44 w-full sm:h-60" />
          <span className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/90 shadow sm:hidden" aria-hidden="true" />
        </div>
        <div className="px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-9">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-perle">
              <img src={asset(`pole-${pole.slug}.png`)} alt="" className="h-9 w-9 object-contain" />
            </span>
            <div className="min-w-0">
              <h3 id="fiche-titre" className="font-display text-2xl font-extrabold leading-tight tracking-[-0.025em] sm:text-3xl">{pole.nom}</h3>
              <p className="mt-0.5 text-sm font-medium text-encre">{pole.prestations.length} prestations</p>
            </div>
          </div>
          <p className="mt-5 max-w-[62ch] whitespace-pre-line text-[15px] leading-relaxed text-encre sm:text-lg">{pole.introduction}</p>
          <ul className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {pole.prestations.map((s) => (
              <li key={s.titre} className="flex gap-3">
                <CheckCircle size={20} className="mt-0.5 shrink-0 text-rouge" aria-hidden />
                <div>
                  <p className="font-bold">{s.titre}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-encre">{s.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <figure className="mt-8 rounded-2xl bg-perle p-5 sm:p-6">
            <figcaption className="text-sm font-semibold text-encre">Notre engagement</figcaption>
            <blockquote className="mt-1 font-display font-semibold leading-snug sm:text-lg">{pole.engagement}</blockquote>
          </figure>
        </div>
      </div>

      <div className="fiche-pied grid grid-cols-[1fr_auto] gap-2 border-t border-ligne bg-white px-4 py-3 sm:flex sm:items-center sm:justify-end sm:gap-3 sm:px-10 sm:py-5" data-ombre={ombre}>
        <a href={lienWhatsApp(p['contact.whatsapp'], messageWhatsApp)} target="_blank" rel="noopener" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-rouge px-5 font-bold text-white transition-[background-color,transform] hover:bg-rouge-fonce active:scale-[.97] sm:h-14 sm:px-6">
          <WhatsappLogo size={20} aria-hidden />Contacter le pôle
        </a>
        <a href={lienTelephone(p['contact.telephone'])} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-ligne px-4 font-bold transition-[border-color,transform] hover:border-navy active:scale-[.97] sm:h-14 sm:px-6">
          <Phone size={20} aria-hidden />Appeler
        </a>
      </div>
    </dialog>
  );
}

/** Mobile : glisser la photo vers le bas ferme la fiche ; un geste vif suffit, un petit glissement est ignoré. */
function useSwipeToClose(
  dialogRef: React.RefObject<HTMLDialogElement>,
  defilRef: React.RefObject<HTMLDivElement>,
  fermer: () => void,
) {
  const geste = useRef<{ y0: number; t0: number; dy: number } | null>(null);
  const mobile = () => matchMedia('(max-width: 639px)').matches;

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!mobile() || (defilRef.current?.scrollTop ?? 0) > 0) return;
    geste.current = { y0: e.clientY, t0: performance.now(), dy: 0 };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointeur synthétique */ }
    if (dialogRef.current) dialogRef.current.style.transition = 'none';
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = geste.current;
    const dialog = dialogRef.current;
    if (!g || !dialog) return;
    const brut = e.clientY - g.y0;
    g.dy = brut > 0 ? brut : brut / 4; // résistance vers le haut
    dialog.style.transform = `translateY(${g.dy}px)`;
  };
  const relacher = () => {
    const g = geste.current;
    const dialog = dialogRef.current;
    geste.current = null;
    if (!g || !dialog) return;
    const vitesse = Math.abs(g.dy) / (performance.now() - g.t0);
    dialog.style.transition = 'transform .25s cubic-bezier(.23, 1, .32, 1)';
    const reinitialiser = () => { dialog.style.transform = ''; dialog.style.transition = ''; };
    if (g.dy > 110 || (g.dy > 24 && vitesse > 0.11)) {
      dialog.style.transform = 'translateY(100%)';
      setTimeout(() => { fermer(); reinitialiser(); }, 230);
    } else {
      dialog.style.transform = '';
    }
  };
  return { onPointerDown, onPointerMove, onPointerUp: relacher, onPointerCancel: relacher };
}
