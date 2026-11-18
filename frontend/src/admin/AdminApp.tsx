import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { ArrowSquareOut, Envelope, SignOut, SquaresFour, TextAa, type Icon } from '@phosphor-icons/react';
import { asset } from '../lib/liens';
import { SessionProvider, useSession } from './session';
import { Connexion } from './pages/Connexion';
import { Propositions } from './pages/Propositions';
import { Contenus } from './pages/Contenus';
import { ListePoles } from './pages/ListePoles';
import { EditionPole } from './pages/EditionPole';

/** Panel d'administration (/admin/...). */
export default function AdminApp() {
  return (
    <SessionProvider>
      <Garde />
    </SessionProvider>
  );
}

function Garde() {
  const { admin, verifiee } = useSession();
  if (!verifiee) return <div className="grid min-h-dvh place-items-center bg-perle text-encre">Chargement…</div>;
  if (!admin) return <Connexion />;
  return (
    <Disposition>
      <Routes>
        <Route index element={<Navigate to="/admin/propositions" replace />} />
        <Route path="propositions" element={<Propositions />} />
        <Route path="contenus" element={<Contenus />} />
        <Route path="poles" element={<ListePoles />} />
        <Route path="poles/:id" element={<EditionPole />} />
        <Route path="*" element={<Navigate to="/admin/propositions" replace />} />
      </Routes>
    </Disposition>
  );
}

const RUBRIQUES: { chemin: string; libelle: string; Icone: Icon }[] = [
  { chemin: '/admin/propositions', libelle: 'Propositions', Icone: Envelope },
  { chemin: '/admin/contenus', libelle: 'Textes et coordonnées', Icone: TextAa },
  { chemin: '/admin/poles', libelle: 'Pôles', Icone: SquaresFour },
];

function Disposition({ children }: { children: React.ReactNode }) {
  const { admin, deconnecter } = useSession();
  const lien = ({ isActive }: { isActive: boolean }) =>
    `flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${isActive ? 'bg-navy text-white' : 'text-encre hover:bg-perle hover:text-navy'}`;

  return (
    <div className="min-h-dvh bg-perle lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 z-10 border-b border-ligne bg-white lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-4 lg:h-auto lg:flex-col lg:items-start lg:gap-8 lg:px-5 lg:pt-7">
          <img src={asset('leef-logo.png')} alt="LEEF GROUP" className="h-9 w-auto lg:h-11" />
          <button type="button" onClick={deconnecter} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-encre hover:bg-perle lg:hidden">
            <SignOut size={18} aria-hidden />Déconnexion
          </button>
        </div>
        <nav aria-label="Panel" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-6 lg:flex-col lg:px-3">
          {RUBRIQUES.map(({ chemin, libelle, Icone }) => (
            <NavLink key={chemin} to={chemin} className={lien}>
              <Icone size={20} aria-hidden />{libelle}
            </NavLink>
          ))}
          <a href="/" target="_blank" rel="noopener" className="flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-encre hover:bg-perle hover:text-navy">
            <ArrowSquareOut size={20} aria-hidden />Voir le site
          </a>
        </nav>
        <div className="absolute inset-x-0 bottom-0 hidden border-t border-ligne p-4 lg:block">
          <p className="truncate px-1 text-xs text-encre" title={admin?.email}>{admin?.email}</p>
          <button type="button" onClick={deconnecter} className="mt-2 flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-encre hover:bg-perle hover:text-navy">
            <SignOut size={18} aria-hidden />Déconnexion
          </button>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 lg:py-12">{children}</main>
    </div>
  );
}
