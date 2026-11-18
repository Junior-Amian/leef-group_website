import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/api';
import { useSession } from './session';

/** Chargement d'une ressource du panel : données, état de chargement, erreur et rechargement. */
export function useChargement<T>(charger: () => Promise<T>, dependances: unknown[] = []) {
  const { siSessionExpiree } = useSession();
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(() => {
    setChargement(true);
    setErreur('');
    charger()
      .then(setDonnees)
      .catch((e: ApiError) => {
        siSessionExpiree(e);
        setErreur(e.message);
      })
      .finally(() => setChargement(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependances);

  useEffect(recharger, [recharger]);

  return { donnees, setDonnees, erreur, chargement, recharger };
}
