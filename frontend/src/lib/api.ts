/**
 * Client HTTP de l'API. Toutes les erreurs arrivent sous la forme d'une ApiError
 * (statut + code + message + erreurs par champ), quel que soit l'appel.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly champs: Record<string, string> = {},
  ) {
    super(message);
  }
}

/** Jeton CSRF du panel, remis à la connexion ; renvoyé sur chaque écriture. */
let csrfToken = '';
export const setCsrfToken = (token: string) => {
  csrfToken = token;
};

type Options = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown };

/** Démo statique (GitHub Pages) : pas d'API, le contenu vient d'un instantané JSON exporté de l'API. */
export const DEMO_STATIQUE = import.meta.env.VITE_STATIC === 'true';

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  return DEMO_STATIQUE ? apiDemo<T>(path, options) : apiServeur<T>(path, options);
}

async function apiDemo<T>(path: string, { method = 'GET' }: Options): Promise<T> {
  if (method === 'GET' && path === '/site') {
    const reponse = await fetch(`${import.meta.env.BASE_URL}contenu-demo.json`);
    if (reponse.ok) return reponse.json();
  }
  throw new ApiError(0, 'demo', 'Version de démonstration : l’envoi est désactivé. Écrivez-nous sur WhatsApp ou par e-mail.');
}

async function apiServeur<T>(path: string, { method = 'GET', body }: Options): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (csrfToken && method !== 'GET') headers['X-CSRF-Token'] = csrfToken;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // le navigateur fixe lui-même le Content-Type multipart
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, { method, headers, body: payload, credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'reseau', 'Connexion impossible. Vérifiez votre réseau et réessayez.');
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const erreur = data?.erreur;
    throw new ApiError(
      response.status,
      erreur?.code ?? 'inconnue',
      erreur?.message ?? 'Une erreur est survenue. Réessayez dans un instant.',
      erreur?.champs ?? {},
    );
  }
  return data as T;
}
