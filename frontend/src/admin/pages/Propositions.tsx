import { useState } from 'react';
import { CaretLeft, CaretRight, EnvelopeSimple, Trash, Tray } from '@phosphor-icons/react';
import { api, ApiError } from '../../lib/api';
import { lienEmail } from '../../lib/liens';
import type { PageDePropositions, Profil, Proposition } from '../../lib/types';
import { useSession } from '../session';
import { useChargement } from '../useChargement';
import { Bouton, EnTete, EtatChargement, Message } from '../ui';

const PROFILS: Record<Profil, string> = {
  entreprise: 'Entreprise',
  institution: 'Institution',
  investisseur: 'Investisseur',
  technique: 'Partenaire technique',
};

const dateLisible = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

/** Propositions de partenariat reçues depuis le site. */
export function Propositions() {
  const [page, setPage] = useState(1);
  const { donnees, setDonnees, erreur, chargement, recharger } = useChargement(
    () => api<PageDePropositions>(`/admin/propositions?page=${page}`),
    [page],
  );

  const remplacer = (p: Proposition) =>
    setDonnees((d) => d && {
      ...d,
      nonLues: d.nonLues + (p.lue === d.elements.find((x) => x.id === p.id)?.lue ? 0 : p.lue ? -1 : 1),
      elements: d.elements.map((x) => (x.id === p.id ? p : x)),
    });

  return (
    <>
      <EnTete
        titre="Propositions de partenariat"
        description={donnees ? `${donnees.total} au total, dont ${donnees.nonLues} non lue${donnees.nonLues > 1 ? 's' : ''}.` : undefined}
      />
      {!donnees ? (
        <EtatChargement chargement={chargement} erreur={erreur} onReessayer={recharger} />
      ) : donnees.elements.length === 0 ? (
        <div className="rounded-[24px] bg-white p-10 text-center ring-1 ring-ligne">
          <Tray size={40} weight="light" className="mx-auto text-encre" aria-hidden />
          <p className="mt-4 font-display text-lg font-bold">Aucune proposition pour l’instant</p>
          <p className="mt-1 text-sm text-encre">Les propositions envoyées depuis le formulaire du site apparaîtront ici.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {donnees.elements.map((p) => (
              <CarteProposition key={p.id} proposition={p} onChange={remplacer} onSupprime={recharger} />
            ))}
          </ul>
          {donnees.pages > 1 && (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
              <Bouton variante="secondaire" disabled={page <= 1} onClick={() => setPage(page - 1)}><CaretLeft size={16} aria-hidden />Précédentes</Bouton>
              <span className="text-sm text-encre">Page {donnees.page} sur {donnees.pages}</span>
              <Bouton variante="secondaire" disabled={page >= donnees.pages} onClick={() => setPage(page + 1)}>Suivantes<CaretRight size={16} aria-hidden /></Bouton>
            </nav>
          )}
        </>
      )}
    </>
  );
}

function CarteProposition({ proposition: p, onChange, onSupprime }: {
  proposition: Proposition; onChange: (p: Proposition) => void; onSupprime: () => void;
}) {
  const { siSessionExpiree } = useSession();
  const [ouverte, setOuverte] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
  const [erreur, setErreur] = useState('');

  const action = async (travail: () => Promise<void>) => {
    setErreur('');
    try {
      await travail();
    } catch (e) {
      siSessionExpiree(e);
      setErreur((e as ApiError).message);
    }
  };

  const marquer = (lue: boolean) => action(async () => {
    const { proposition } = await api<{ proposition: Proposition }>(`/admin/propositions/${p.id}`, { method: 'PATCH', body: { lue } });
    onChange(proposition);
  });

  const basculer = () => {
    setOuverte(!ouverte);
    if (!ouverte && !p.lue) marquer(true); // ouvrir une proposition la marque comme lue
  };

  return (
    <li className={`rounded-2xl bg-white ring-1 transition-shadow ${p.lue ? 'ring-ligne' : 'ring-navy/25 shadow-[0_10px_30px_-20px_rgb(0_19_78/.5)]'}`}>
      <button type="button" onClick={basculer} aria-expanded={ouverte} className="flex w-full items-start gap-4 p-4 text-left sm:p-5">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${p.lue ? 'bg-transparent' : 'bg-rouge'}`} aria-label={p.lue ? undefined : 'Non lue'} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className={`font-display text-lg ${p.lue ? 'font-semibold' : 'font-extrabold'}`}>{p.organisation}</span>
            <span className="text-xs text-encre">{dateLisible(p.creeLe)}</span>
          </span>
          <span className="mt-0.5 block text-sm text-encre">{p.nom} · {PROFILS[p.profil]} · {p.pole}</span>
          {!ouverte && <span className="mt-1.5 block truncate text-sm">{p.message}</span>}
        </span>
      </button>

      {ouverte && (
        <div className="border-t border-ligne px-4 pb-5 pt-4 sm:px-5 sm:pl-[3.4rem]">
          <p className="whitespace-pre-line leading-relaxed">{p.message}</p>
          {erreur && <div className="mt-4"><Message type="erreur">{erreur}</Message></div>}
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={lienEmail(p.email, 'Votre proposition de partenariat')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-bold text-white hover:bg-navy-800">
              <EnvelopeSimple size={18} aria-hidden />Répondre à {p.email}
            </a>
            <Bouton variante="secondaire" onClick={() => marquer(!p.lue)}>{p.lue ? 'Marquer comme non lue' : 'Marquer comme lue'}</Bouton>
            {confirmer ? (
              <>
                <Bouton variante="danger" onClick={() => action(async () => { await api(`/admin/propositions/${p.id}`, { method: 'DELETE' }); onSupprime(); })}>Confirmer la suppression</Bouton>
                <Bouton variante="secondaire" onClick={() => setConfirmer(false)}>Annuler</Bouton>
              </>
            ) : (
              <Bouton variante="danger" onClick={() => setConfirmer(true)}><Trash size={18} aria-hidden />Supprimer</Bouton>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
