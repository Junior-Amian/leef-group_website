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

export type Appareil = 'mobile' | 'tablette' | 'ordinateur';

export type TotauxStatistiques = { pagesVues: number; visiteurs: number; visites: number; propositions: number };

/** Tableau de bord du panel (GET /api/admin/statistiques?periode=7|30|90). Dates au format AAAA-MM-JJ. */
export type Statistiques = {
  periode: 7 | 30 | 90;
  debut: string;
  fin: string;
  totaux: TotauxStatistiques;
  /** Même durée, juste avant la période : sert à l'évolution des indicateurs. */
  precedent: TotauxStatistiques;
  parJour: { jour: string; pagesVues: number; visiteurs: number; propositions: number }[];
  pages: { chemin: string; libelle: string; pagesVues: number; visiteurs: number }[];
  /** source vide = accès direct (adresse tapée, favori, application). */
  sources: { source: string; visites: number }[];
  appareils: Record<Appareil, number>;
  propositionsParProfil: { profil: Profil; nombre: number }[];
  propositionsParPole: { pole: string; nombre: number }[];
  nonLues: number;
};

declare global {
  interface Window {
    /** Contenu injecté dans la page par le serveur (absent en développement). */
    __SITE__?: SiteContent;
  }
}
