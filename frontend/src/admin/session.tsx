import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError, setCsrfToken } from '../lib/api';
import type { Admin } from '../lib/types';

type Session = {
  admin: Admin | null;
  verifiee: boolean;
  connecter: (email: string, motDePasse: string) => Promise<void>;
  deconnecter: () => Promise<void>;
  /** À appeler sur toute erreur d'API : une session expirée renvoie à la connexion. */
  siSessionExpiree: (erreur: unknown) => void;
};

type ReponseSession = { admin: Admin; csrfToken: string };

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [verifiee, setVerifiee] = useState(false);

  const ouvrir = ({ admin, csrfToken }: ReponseSession) => {
    setCsrfToken(csrfToken);
    setAdmin(admin);
  };

  useEffect(() => {
    api<ReponseSession>('/session')
      .then(ouvrir)
      .catch(() => setAdmin(null))
      .finally(() => setVerifiee(true));
  }, []);

  const connecter = useCallback(async (email: string, motDePasse: string) => {
    ouvrir(await api<ReponseSession>('/session', { method: 'POST', body: { email, motDePasse } }));
  }, []);

  const deconnecter = useCallback(async () => {
    await api('/session', { method: 'DELETE' }).catch(() => undefined);
    setCsrfToken('');
    setAdmin(null);
  }, []);

  const siSessionExpiree = useCallback((erreur: unknown) => {
    if (erreur instanceof ApiError && (erreur.status === 401 || erreur.status === 419)) {
      setCsrfToken('');
      setAdmin(null);
    }
  }, []);

  return (
    <SessionContext.Provider value={{ admin, verifiee, connecter, deconnecter, siSessionExpiree }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession doit être utilisé dans SessionProvider');
  return session;
}
