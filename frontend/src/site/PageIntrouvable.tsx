import { ArrowLeft } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { asset } from '../lib/liens';

/** Adresse inconnue (le serveur répond 404 et demande aux moteurs de ne pas l'indexer). */
export function PageIntrouvable() {
  return (
    <main className="grid min-h-dvh place-items-center bg-perle px-6 text-center">
      <div>
        <img src={asset('leef-logo.png')} alt="LEEF GROUP" width={1295} height={510} className="mx-auto h-14 w-auto" />
        <h1 className="mt-10 font-display text-4xl font-black tracking-[-0.035em] sm:text-5xl">Page introuvable</h1>
        <p className="mt-4 text-lg text-encre">Cette adresse n’existe pas ou plus.</p>
        <Link to="/" className="mt-8 inline-flex h-14 items-center gap-2 rounded-xl bg-navy px-6 font-bold text-white transition-[background-color,transform] hover:bg-navy-800 active:scale-[.97]">
          <ArrowLeft size={18} aria-hidden />Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
