/** Contrat de l'API PHP (voir backend/config/routes.php). */

export type Prestation = {
  titre: string;
  libelleCourt: string;
  description: string;
};

export type Pole = {
  id: number;
  slug: PoleSlug;
  nom: string;
  resume: string;
  accroche: string;
  introduction: string;
  engagement: string;
  image: string;
  imageAlt: string;
  actif: boolean;
  prestations: Prestation[];
};

export type PoleSlug = 'transport' | 'immobilier' | 'medias' | 'informatique' | 'evenementiel' | 'social';

/** Paramètres publics : clé → valeur (les clés sont définies côté API, dans Models/Setting.php). */
export type Parametres = Record<string, string>;

export type SiteContent = {
  parametres: Parametres;
  poles: Pole[];
};

export type Profil = 'entreprise' | 'institution' | 'investisseur' | 'technique';

export type Proposition = {
  id: number;
  profil: Profil;
  organisation: string;
  nom: string;
  email: string;
  pole: string;
  message: string;
  lue: boolean;
  creeLe: string;
};

export type PageDePropositions = {
  elements: Proposition[];
  page: number;
  pages: number;
  total: number;
  nonLues: number;
};

export type TypeParametre = 'texte' | 'paragraphe' | 'liste' | 'email' | 'telephone' | 'url' | 'decimal';

export type DefinitionParametre = {
  cle: string;
  groupe: string;
  libelle: string;
  type: TypeParametre;
  requis: boolean;
  max?: number;
  prive?: boolean;
};

export type Admin = { id: number; email: string };

declare global {
  interface Window {
    /** Contenu injecté dans la page par le serveur (absent en développement). */
    __SITE__?: SiteContent;
  }
}
