import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChartLineUp, Minus, ShieldCheck } from '@phosphor-icons/react';
import { api } from '../../lib/api';
import type { Appareil, Profil, Statistiques as DonneesStatistiques } from '../../lib/types';
import { useChargement } from '../useChargement';
import { EnTete, EtatChargement } from '../ui';

const PERIODES = [7, 30, 90] as const;
type Periode = (typeof PERIODES)[number];

const PROFILS: Record<Profil, string> = {
  entreprise: 'Entreprises',
  institution: 'Institutions',
  investisseur: 'Investisseurs',
  technique: 'Partenaires techniques',
};

const APPAREILS: Record<Appareil, string> = { mobile: 'Mobile', tablette: 'Tablette', ordinateur: 'Ordinateur' };

const nombre = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const pourcentage = (part: number, total: number) => (total > 0 ? `${Math.round((part / total) * 100)} %` : '0 %');
const dateCourte = (jour: string, avecJourSemaine = false) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', ...(avecJourSemaine && { weekday: 'short' }) })
    .format(new Date(`${jour}T12:00:00`));

/** Tableau de bord : fréquentation du site et propositions reçues sur la période choisie. */
export function Statistiques() {
  const [periode, setPeriode] = useState<Periode>(30);
  const { donnees, erreur, chargement, recharger } = useChargement(
    () => api<DonneesStatistiques>(`/admin/statistiques?periode=${periode}`),
    [periode],
  );

  return (
    <>
      <EnTete
        titre="Tableau de bord"
        description="Fréquentation du site et propositions de partenariat reçues."
        actions={<SelecteurPeriode valeur={periode} onChange={setPeriode} />}
      />
      {!donnees ? (
        <EtatChargement chargement={chargement} erreur={erreur} onReessayer={recharger} />
      ) : (
        // Pendant le rechargement (changement de période), l'affichage précédent reste en place, atténué.
        <div className={`space-y-6 transition-opacity ${chargement ? 'opacity-60' : ''}`} aria-busy={chargement}>
          {donnees.nonLues > 0 && (
            <Link to="/admin/propositions" className="flex items-center justify-between gap-4 rounded-2xl bg-navy px-5 py-4 text-white transition-colors hover:bg-navy-800">
              <span className="flex items-center gap-3 font-semibold">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rouge" aria-hidden />
                {donnees.nonLues} proposition{donnees.nonLues > 1 ? 's' : ''} non lue{donnees.nonLues > 1 ? 's' : ''}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold">Les consulter<ArrowRight size={16} aria-hidden /></span>
            </Link>
          )}
          <Indicateurs d={donnees} />
          <Carte titre="Visiteurs par jour" sousTitre={`Du ${dateCourte(donnees.debut)} au ${dateCourte(donnees.fin)}`}>
            {donnees.totaux.pagesVues === 0 ? (
              <EtatVide texte="Aucune visite enregistrée sur cette période. Les chiffres apparaîtront dès les premières visites du site." />
            ) : (
              <CourbeFrequentation jours={donnees.parJour} />
            )}
          </Carte>
          <div className="grid gap-6 lg:grid-cols-2">
            <Carte titre="Pages les plus vues">
              <ListeBarres
                elements={donnees.pages.map((p) => ({ cle: p.chemin, libelle: p.libelle, valeur: p.pagesVues, detail: `${nombre(p.visiteurs)} visiteur${p.visiteurs > 1 ? 's' : ''}` }))}
                unite="vues"
                vide="Aucune page vue sur cette période."
              />
            </Carte>
            <Carte titre="Provenance des visites" sousTitre="Site d’où arrivent les visiteurs">
              <ListeBarres
                elements={donnees.sources.map((s) => ({ cle: s.source || '-', libelle: s.source || 'Accès direct', valeur: s.visites, detail: pourcentage(s.visites, donnees.totaux.visites) }))}
                unite="visites"
                vide="Aucune arrivée sur le site sur cette période."
              />
            </Carte>
            <Carte titre="Appareils utilisés">
              <ListeBarres
                elements={(Object.keys(APPAREILS) as Appareil[]).map((a) => ({ cle: a, libelle: APPAREILS[a], valeur: donnees.appareils[a], detail: pourcentage(donnees.appareils[a], donnees.totaux.visiteurs) }))}
                unite="visiteurs"
                vide="Aucun visiteur sur cette période."
                masquerSiVide
              />
            </Carte>
            <Carte titre="Propositions reçues">
              {donnees.totaux.propositions === 0 ? (
                <EtatVide texte="Aucune proposition de partenariat sur cette période." />
              ) : (
                <div className="space-y-6">
                  <SousListe titre="Par profil">
                    <ListeBarres elements={donnees.propositionsParProfil.map((p) => ({ cle: p.profil, libelle: PROFILS[p.profil], valeur: p.nombre }))} unite="propositions" vide="" />
                  </SousListe>
                  <SousListe titre="Par pôle visé">
                    <ListeBarres elements={donnees.propositionsParPole.map((p) => ({ cle: p.pole, libelle: p.pole, valeur: p.nombre }))} unite="propositions" vide="" />
                  </SousListe>
                </div>
              )}
            </Carte>
          </div>
          <p className="flex items-start gap-2 text-sm text-encre">
            <ShieldCheck size={18} className="mt-px shrink-0" aria-hidden />
            Mesure anonyme, sans cookie : aucune adresse IP n’est conservée et un visiteur n’est reconnu que le jour même.
            Les robots et les visites de l’équipe connectée au panel ne sont pas comptés.
          </p>
        </div>
      )}
    </>
  );
}

function SelecteurPeriode({ valeur, onChange }: { valeur: Periode; onChange: (p: Periode) => void }) {
  return (
    <div role="group" aria-label="Période" className="inline-flex self-start rounded-xl bg-white p-1 ring-1 ring-ligne sm:self-auto">
      {PERIODES.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={p === valeur}
          onClick={() => onChange(p)}
          className={`h-9 rounded-lg px-3.5 text-sm font-bold transition-colors ${p === valeur ? 'bg-navy text-white' : 'text-encre hover:text-navy'}`}
        >
          {p} jours
        </button>
      ))}
    </div>
  );
}

/** Les quatre indicateurs de la période, comparés à la période précédente de même durée. */
function Indicateurs({ d }: { d: DonneesStatistiques }) {
  const taux = (t: DonneesStatistiques['totaux']) => (t.visiteurs > 0 ? (t.propositions / t.visiteurs) * 100 : 0);
  const tauxActuel = taux(d.totaux);
  const tauxPrecedent = taux(d.precedent);
  const comparaison = `par rapport aux ${d.periode} jours précédents`;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <Tuile libelle="Visiteurs" valeur={nombre(d.totaux.visiteurs)} evolution={evolution(d.totaux.visiteurs, d.precedent.visiteurs)} comparaison={comparaison} />
      <Tuile libelle="Pages vues" valeur={nombre(d.totaux.pagesVues)} evolution={evolution(d.totaux.pagesVues, d.precedent.pagesVues)} comparaison={comparaison} />
      <Tuile libelle="Propositions reçues" valeur={nombre(d.totaux.propositions)} evolution={evolution(d.totaux.propositions, d.precedent.propositions)} comparaison={comparaison} />
      <Tuile
        libelle="Taux de conversion"
        valeur={`${tauxActuel.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`}
        evolution={evolutionPoints(tauxActuel, tauxPrecedent, d.precedent.visiteurs > 0)}
        comparaison={comparaison}
        aide="Propositions reçues pour 100 visiteurs"
      />
    </ul>
  );
}

type Evolution = { texte: string; sens: 'hausse' | 'baisse' | 'stable' } | null;

/** Évolution en % ; null si la période précédente est vide (une hausse « infinie » n'apprend rien). */
function evolution(actuel: number, precedent: number): Evolution {
  if (precedent === 0) return actuel === 0 ? { texte: 'Stable', sens: 'stable' } : null;
  const ecart = Math.round(((actuel - precedent) / precedent) * 100);
  if (ecart === 0) return { texte: 'Stable', sens: 'stable' };
  return { texte: `${ecart > 0 ? '+' : '−'}${Math.abs(ecart)} %`, sens: ecart > 0 ? 'hausse' : 'baisse' };
}

/** Évolution d'un taux, en points. */
function evolutionPoints(actuel: number, precedent: number, comparable: boolean): Evolution {
  if (!comparable) return null;
  const ecart = Math.round((actuel - precedent) * 10) / 10;
  if (ecart === 0) return { texte: 'Stable', sens: 'stable' };
  return { texte: `${ecart > 0 ? '+' : '−'}${Math.abs(ecart).toLocaleString('fr-FR')} pt`, sens: ecart > 0 ? 'hausse' : 'baisse' };
}

const STYLE_EVOLUTION = {
  hausse: { classe: 'text-emerald-700', Icone: ArrowUpRight, lu: 'En hausse' },
  baisse: { classe: 'text-rouge-fonce', Icone: ArrowDownRight, lu: 'En baisse' },
  stable: { classe: 'text-encre', Icone: Minus, lu: '' },
} as const;

function Tuile({ libelle, valeur, evolution: e, comparaison, aide }: {
  libelle: string; valeur: string; evolution: Evolution; comparaison: string; aide?: string;
}) {
  const style = e && STYLE_EVOLUTION[e.sens];
  return (
    <li className="rounded-2xl bg-white p-4 ring-1 ring-ligne sm:p-5">
      <p className="text-sm font-semibold text-encre">{libelle}</p>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-[-0.02em] text-navy">{valeur}</p>
      <p className="mt-2 min-h-5 text-xs" title={e ? comparaison : undefined}>
        {style && e ? (
          <span className={`inline-flex items-center gap-1 font-bold ${style.classe}`}>
            <style.Icone size={14} weight="bold" aria-hidden />
            {style.lu && <span className="sr-only">{style.lu} : </span>}
            {e.texte}
            <span className="sr-only"> {comparaison}</span>
          </span>
        ) : (
          <span className="text-encre">Pas de période précédente à comparer</span>
        )}
      </p>
      {aide && <p className="mt-1 text-xs text-encre">{aide}</p>}
    </li>
  );
}

function Carte({ titre, sousTitre, children }: { titre: string; sousTitre?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] bg-white p-5 ring-1 ring-ligne sm:p-6">
      <h2 className="font-display text-lg font-bold">{titre}</h2>
      {sousTitre && <p className="mt-0.5 text-sm text-encre">{sousTitre}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SousListe({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-encre">{titre}</h3>
      {children}
    </div>
  );
}

function EtatVide({ texte }: { texte: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-perle px-6 py-10 text-center">
      <ChartLineUp size={36} weight="light" className="text-encre" aria-hidden />
      <p className="mt-3 max-w-sm text-sm text-encre">{texte}</p>
    </div>
  );
}

/** Classement en barres horizontales ; la plus grande valeur occupe toute la largeur. */
function ListeBarres({ elements, unite, vide, masquerSiVide }: {
  elements: { cle: string; libelle: string; valeur: number; detail?: string }[];
  unite: string; vide: string; masquerSiVide?: boolean;
}) {
  const max = Math.max(0, ...elements.map((e) => e.valeur));
  if (elements.length === 0 || (masquerSiVide && max === 0)) return <EtatVide texte={vide} />;
  return (
    <ul className="space-y-3.5">
      {elements.map((e) => (
        <li key={e.cle}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0 truncate font-semibold" title={e.libelle}>{e.libelle}</span>
            <span className="shrink-0">
              <span className="font-bold">{nombre(e.valeur)}</span>
              <span className="sr-only"> {unite}</span>
              {e.detail && <span className="ml-2 text-encre">{e.detail}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-r bg-perle" aria-hidden>
            <div className="h-full rounded-r bg-navy" style={{ width: `${max > 0 ? Math.max((e.valeur / max) * 100, e.valeur > 0 ? 1.5 : 0) : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Pas « rond » (1, 2 ou 5 × 10^n) pour graduer l'axe vertical en 4 intervalles. */
function pasRond(max: number): number {
  const brut = Math.max(max, 4) / 4;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  return ([1, 2, 5, 10].find((m) => m * puissance >= brut) ?? 10) * puissance;
}

const HAUTEUR = 240;
const MARGE = { haut: 12, droite: 12, bas: 28, gauche: 40 };

/** Courbe des visiteurs par jour, avec repère et détail du jour au survol ou au clavier (flèches). */
function CourbeFrequentation({ jours }: { jours: DonneesStatistiques['parJour'] }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(0);
  const [actif, setActif] = useState<number | null>(null);

  useEffect(() => {
    const element = conteneur.current;
    if (!element) return;
    const observateur = new ResizeObserver(([entree]) => setLargeur(entree.contentRect.width));
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  const pas = pasRond(Math.max(...jours.map((j) => j.visiteurs)));
  const sommet = pas * 4;
  const zoneL = Math.max(largeur - MARGE.gauche - MARGE.droite, 1);
  const zoneH = HAUTEUR - MARGE.haut - MARGE.bas;
  const x = (i: number) => MARGE.gauche + (jours.length > 1 ? (i / (jours.length - 1)) * zoneL : zoneL / 2);
  const y = (v: number) => MARGE.haut + zoneH - (v / sommet) * zoneH;

  const points = jours.map((j, i) => `${x(i)},${y(j.visiteurs)}`).join(' ');
  const aire = `M${x(0)},${y(0)} L${points.replaceAll(' ', ' L')} L${x(jours.length - 1)},${y(0)} Z`;

  // Quelques dates réparties sur l'axe horizontal, selon la place disponible.
  const nbEtiquettes = Math.min(jours.length, largeur < 480 ? 4 : 7);
  const etiquettes = [...new Set(Array.from({ length: nbEtiquettes }, (_, k) => Math.round((k / Math.max(nbEtiquettes - 1, 1)) * (jours.length - 1))))];

  const survoler = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setActif(Math.min(jours.length - 1, Math.max(0, Math.round(ratio * (jours.length - 1)))));
  };

  const clavier = (e: KeyboardEvent<HTMLDivElement>) => {
    const suivant = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (suivant !== undefined) {
      e.preventDefault();
      setActif((a) => Math.min(jours.length - 1, Math.max(0, (a ?? jours.length - 1) + (a === null ? 0 : suivant))));
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setActif(e.key === 'Home' ? 0 : jours.length - 1);
    }
  };

  const jourActif = actif !== null ? jours[actif] : null;
  const total = jours.reduce((s, j) => s + j.visiteurs, 0);

  return (
    <>
      <div
        ref={conteneur}
        tabIndex={0}
        onKeyDown={clavier}
        onFocus={() => setActif((a) => a ?? jours.length - 1)}
        onBlur={() => setActif(null)}
        role="img"
        aria-label={`Courbe des visiteurs par jour : ${nombre(total)} visiteurs sur ${jours.length} jours. Flèches gauche et droite pour parcourir les jours.`}
        className="relative rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-navy/15"
      >
        {largeur > 0 && (
          <svg width={largeur} height={HAUTEUR} className="block overflow-visible" aria-hidden>
            {[0, 1, 2, 3, 4].map((k) => (
              <g key={k}>
                <line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={y(k * pas)} y2={y(k * pas)} stroke="#E3E4E9" strokeWidth={1} />
                <text x={MARGE.gauche - 10} y={y(k * pas)} dy="0.32em" textAnchor="end" className="fill-encre text-[11px]">{nombre(k * pas)}</text>
              </g>
            ))}
            {etiquettes.map((i) => (
              <text key={i} x={x(i)} y={HAUTEUR - 8} textAnchor={i === 0 ? 'start' : i === jours.length - 1 ? 'end' : 'middle'} className="fill-encre text-[11px]">
                {dateCourte(jours[i].jour)}
              </text>
            ))}
            <path d={aire} fill="#00134E" fillOpacity={0.08} />
            <polyline points={points} fill="none" stroke="#00134E" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {actif !== null && (
              <g>
                <line x1={x(actif)} x2={x(actif)} y1={MARGE.haut} y2={y(0)} stroke="#4A4F63" strokeOpacity={0.35} strokeWidth={1} />
                <circle cx={x(actif)} cy={y(jours[actif].visiteurs)} r={5} fill="#00134E" stroke="#fff" strokeWidth={2} />
              </g>
            )}
            <rect
              x={MARGE.gauche} y={MARGE.haut} width={zoneL} height={zoneH} fill="transparent"
              onPointerMove={survoler} onPointerDown={survoler} onPointerLeave={() => setActif(null)}
            />
          </svg>
        )}
        {jourActif && actif !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-max min-w-[150px] -translate-x-1/2 rounded-xl bg-navy px-3.5 py-2.5 text-white shadow-[0_12px_30px_-12px_rgb(0_19_78/.6)]"
            style={{ left: Math.min(Math.max(x(actif), 80), largeur - 80) }}
          >
            <p className="text-xs text-white/70">{dateCourte(jourActif.jour, true)}</p>
            <p className="mt-1 text-sm"><strong className="text-base">{nombre(jourActif.visiteurs)}</strong> visiteur{jourActif.visiteurs > 1 ? 's' : ''}</p>
            <p className="text-xs text-white/80"><span>{nombre(jourActif.pagesVues)}</span> pages vues · <span>{nombre(jourActif.propositions)}</span> proposition{jourActif.propositions > 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-navy">Voir les chiffres jour par jour</summary>
        <div className="mt-3 max-h-72 overflow-auto rounded-xl ring-1 ring-ligne">
          <table className="w-full text-left tabular-nums">
            <thead className="sticky top-0 bg-perle text-xs uppercase tracking-[0.06em] text-encre">
              <tr><th className="px-3 py-2 font-bold">Jour</th><th className="px-3 py-2 text-right font-bold">Visiteurs</th><th className="px-3 py-2 text-right font-bold">Pages vues</th><th className="px-3 py-2 text-right font-bold">Propositions</th></tr>
            </thead>
            <tbody>
              {[...jours].reverse().map((j) => (
                <tr key={j.jour} className="border-t border-ligne">
                  <td className="px-3 py-2">{dateCourte(j.jour, true)}</td>
                  <td className="px-3 py-2 text-right">{nombre(j.visiteurs)}</td>
                  <td className="px-3 py-2 text-right">{nombre(j.pagesVues)}</td>
                  <td className="px-3 py-2 text-right">{nombre(j.propositions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
