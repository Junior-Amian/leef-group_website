import { useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowBendDownRight, ArrowRight, CaretDown, CheckCircle } from '@phosphor-icons/react';
import { api, ApiError } from '../lib/api';
import { asset } from '../lib/liens';
import type { Parametres, Pole, Profil } from '../lib/types';
import { PLUSIEURS_POLES } from './sections';

const PROFILS: { valeur: Profil; libelle: string; enTantQue: string }[] = [
  { valeur: 'entreprise', libelle: 'Entreprise', enTantQue: 'une entreprise' },
  { valeur: 'institution', libelle: 'Institution', enTantQue: 'une institution' },
  { valeur: 'investisseur', libelle: 'Investisseur', enTantQue: 'un investisseur' },
  { valeur: 'technique', libelle: 'Partenaire technique', enTantQue: 'un partenaire technique' },
];

const VIDE = { organisation: '', nom: '', email: '', pole: PLUSIEURS_POLES, message: '', siteWeb: '' };
type Champs = typeof VIDE;

/** Sélecteur de profil (pistes de collaboration) et formulaire de proposition de partenariat. */
export function Partenariat({ p, poles }: { p: Parametres; poles: Pole[] }) {
  const [profil, setProfil] = useState<Profil>('entreprise');
  const profilChoisi = PROFILS.find((x) => x.valeur === profil)!;
  const pistes = (p[`partenariat.pistes.${profil}`] ?? '').split('\n').filter(Boolean);

  return (
    <section id="partenariats" className="sur-sombre relative overflow-hidden bg-navy py-16 text-white sm:py-24 lg:py-32">
      <img src={asset('leef-symbole-blanc.png')} alt="" aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 w-[480px] opacity-[.08]" />
      <div className="relative mx-auto grid max-w-[1280px] gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-10">
        <div className="lg:col-span-6" data-reveal>
          <h2 className="max-w-[14ch] font-display text-[2.6rem] font-black leading-[.98] tracking-[-0.04em] sm:text-6xl">{p['partenariat.titre']}</h2>
          <p className="mt-6 max-w-[50ch] text-lg leading-relaxed text-white">{p['partenariat.texte']}</p>

          <p id="profil-label" className="mt-10 font-semibold">Vous êtes</p>
          <SelecteurProfil valeur={profil} onChange={setProfil} />

          <p className="mt-8 font-semibold">Pistes de collaboration</p>
          <ul className="mt-4 space-y-3.5" aria-live="polite">
            {pistes.map((piste) => (
              <li key={piste} className="flex gap-3">
                <ArrowBendDownRight size={20} className="mt-0.5 shrink-0 text-rouge" aria-hidden />
                <span className="text-lg font-medium leading-snug">{piste}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6" data-reveal style={{ '--d': '120ms' } as CSSProperties}>
          <div className="rounded-[28px] bg-white p-6 text-navy shadow-[0_40px_80px_-40px_rgb(0_6_30/.8)] sm:p-10">
            <FormulairePartenariat profil={profil} enTantQue={profilChoisi.enTantQue} poles={poles} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Groupe de boutons radio accessible : flèches du clavier pour changer de profil. */
function SelecteurProfil({ valeur, onChange }: { valeur: Profil; onChange: (p: Profil) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const clavier = (e: KeyboardEvent, index: number) => {
    const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!pas) return;
    e.preventDefault();
    const suivant = (index + pas + PROFILS.length) % PROFILS.length;
    onChange(PROFILS[suivant].valeur);
    refs.current[suivant]?.focus();
  };
  return (
    <div role="radiogroup" aria-labelledby="profil-label" className="mt-3 grid max-w-md grid-cols-2 gap-1 rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/25">
      {PROFILS.map((x, i) => (
        <button
          key={x.valeur}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={valeur === x.valeur}
          tabIndex={valeur === x.valeur ? 0 : -1}
          onClick={() => onChange(x.valeur)}
          onKeyDown={(e) => clavier(e, i)}
          className="segment h-11 rounded-xl px-2 text-sm font-bold text-white"
        >
          {x.libelle}
        </button>
      ))}
    </div>
  );
}

function FormulairePartenariat({ profil, enTantQue, poles }: { profil: Profil; enTantQue: string; poles: Pole[] }) {
  const [champs, setChamps] = useState<Champs>(VIDE);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const succesRef = useRef<HTMLDivElement>(null);

  const modifier = (champ: keyof Champs, valeur: string) => {
    setChamps((c) => ({ ...c, [champ]: valeur }));
    if (erreurs[champ]) setErreurs(({ [champ]: _, ...reste }) => reste);
  };

  // La validation fait foi côté serveur : ses erreurs par champ sont affichées sous chaque champ.
  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreurGenerale('');
    try {
      await api('/propositions', { method: 'POST', body: { ...champs, profil } });
      setChamps(VIDE);
      setErreurs({});
      setEnvoye(true);
      requestAnimationFrame(() => succesRef.current?.focus());
    } catch (err) {
      const erreur = err as ApiError;
      setErreurs(erreur.champs);
      if (Object.keys(erreur.champs).length) {
        formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(erreur.champs)[0]}"]`)?.focus();
      } else {
        setErreurGenerale(erreur.message);
      }
    } finally {
      setEnvoi(false);
    }
  };

  if (envoye) {
    return (
      <div ref={succesRef} tabIndex={-1} role="status" className="py-8 outline-none">
        <CheckCircle size={48} weight="light" className="text-rouge" aria-hidden />
        <p className="mt-5 font-display text-3xl font-black tracking-[-0.03em]">Proposition envoyée</p>
        <p className="mt-3 max-w-md text-lg text-encre">Merci. La direction de LEEF GROUP étudie votre proposition et revient vers vous.</p>
        <button type="button" onClick={() => setEnvoye(false)} className="mt-7 font-bold underline underline-offset-4">Envoyer une autre proposition</button>
      </div>
    );
  }

  const champ = (nom: keyof Champs) => ({
    id: `p-${nom}`,
    name: nom,
    value: champs[nom],
    'aria-invalid': erreurs[nom] ? true : undefined,
    'aria-describedby': erreurs[nom] ? `p-${nom}-err` : undefined,
  });

  return (
    <form ref={formRef} onSubmit={envoyer} noValidate className="grid gap-x-8 gap-y-6 sm:grid-cols-2" aria-label="Proposer un partenariat">
      <div className="sm:col-span-2">
        <h3 className="font-display text-2xl font-extrabold tracking-[-0.025em]">Proposer un partenariat</h3>
        <p className="mt-1.5 text-encre">Vous écrivez en tant que <strong className="font-semibold text-navy">{enTantQue}</strong>.</p>
      </div>

      {/* Piège à robots : invisible et inaccessible pour les humains */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="p-siteWeb">Site web</label>
        <input {...champ('siteWeb')} tabIndex={-1} autoComplete="off" onChange={(e) => modifier('siteWeb', e.target.value)} />
      </div>

      <Champ libelle="Organisation" requis erreur={erreurs.organisation} id="p-organisation">
        <input {...champ('organisation')} type="text" autoComplete="organization" onChange={(e) => modifier('organisation', e.target.value)} className="champ h-12 text-lg" />
      </Champ>
      <Champ libelle="Nom et prénom" requis erreur={erreurs.nom} id="p-nom">
        <input {...champ('nom')} type="text" autoComplete="name" onChange={(e) => modifier('nom', e.target.value)} className="champ h-12 text-lg" />
      </Champ>
      <Champ libelle="Adresse e-mail" requis erreur={erreurs.email} id="p-email">
        <input {...champ('email')} type="email" autoComplete="email" onChange={(e) => modifier('email', e.target.value)} className="champ h-12 text-lg" />
      </Champ>
      <Champ libelle="Pôle concerné" erreur={erreurs.pole} id="p-pole">
        <span className="relative block">
          <select {...champ('pole')} onChange={(e) => modifier('pole', e.target.value)} className="champ h-12 w-full appearance-none pr-8 text-lg">
            <option>{PLUSIEURS_POLES}</option>
            {poles.map((pole) => <option key={pole.id}>{pole.nom}</option>)}
          </select>
          <CaretDown size={18} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-encre" aria-hidden />
        </span>
      </Champ>
      <Champ libelle="Votre proposition" requis erreur={erreurs.message} id="p-message" pleineLargeur>
        <textarea {...champ('message')} rows={4} onChange={(e) => modifier('message', e.target.value)} className="champ resize-none py-2 text-lg" />
      </Champ>

      {erreurGenerale && <p role="alert" className="text-sm font-semibold text-rouge-fonce sm:col-span-2">{erreurGenerale}</p>}

      <div className="flex flex-col-reverse gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-encre"><span className="text-rouge" aria-hidden="true">*</span> Champs obligatoires</p>
        <button type="submit" disabled={envoi} aria-busy={envoi} className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-navy px-7 font-bold text-white transition-[background-color,transform] hover:bg-navy-800 active:scale-[.97] disabled:opacity-70">
          {envoi ? 'Envoi en cours…' : 'Envoyer la proposition'}
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
    </form>
  );
}

/** Libellé au-dessus, champ, message d'erreur en dessous. */
function Champ({ libelle, requis, erreur, id, pleineLargeur, children }: {
  libelle: string; requis?: boolean; erreur?: string; id: string; pleineLargeur?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`grid min-w-0 gap-1 ${pleineLargeur ? 'sm:col-span-2' : ''}`}>
      <label htmlFor={id} className="text-sm font-semibold text-encre">
        {libelle} {requis && <span className="text-rouge" aria-hidden="true">*</span>}
      </label>
      {children}
      {erreur && <p id={`${id}-err`} className="text-sm font-medium text-rouge-fonce">{erreur}</p>}
    </div>
  );
}
