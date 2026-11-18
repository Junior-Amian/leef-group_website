import { Link } from 'react-router-dom';
import { PencilSimple } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import { asset } from '../../lib/liens';
import type { Pole } from '../../lib/types';
import { PhotoPole } from '../../shared/PhotoPole';
import { useChargement } from '../useChargement';
import { EnTete, EtatChargement } from '../ui';

export function ListePoles() {
  const { donnees, erreur, chargement, recharger } = useChargement(() => api<{ poles: Pole[] }>('/admin/poles'));

  return (
    <>
      <EnTete titre="Pôles" description="Présentation, photo et prestations de chacun des six pôles." />
      {!donnees ? (
        <EtatChargement chargement={chargement} erreur={erreur} onReessayer={recharger} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {donnees.poles.map((pole) => (
            <li key={pole.id}>
              <Link to={`/admin/poles/${pole.id}`} className="group flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-ligne transition-shadow hover:shadow-[0_14px_30px_-20px_rgb(0_19_78/.5)] hover:ring-navy/25">
                <PhotoPole pole={pole} mention={false} className="h-20 w-24 shrink-0 overflow-hidden rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <img src={asset(`pole-${pole.slug}.png`)} alt="" className="h-5 w-5 object-contain" />
                    <span className="truncate font-display font-bold">{pole.nom}</span>
                  </span>
                  <span className="mt-1 block text-sm text-encre">{pole.prestations.length} prestations</span>
                  <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${pole.actif ? 'bg-emerald-50 text-emerald-800' : 'bg-perle text-encre'}`}>
                    {pole.actif ? 'Affiché sur le site' : 'Masqué'}
                  </span>
                </span>
                <PencilSimple size={20} className="shrink-0 text-encre group-hover:text-navy" aria-label="Modifier" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
