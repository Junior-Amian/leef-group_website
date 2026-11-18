import { useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash, UploadSimple } from '@phosphor-icons/react';
import { api, ApiError } from '../../lib/api';
import { asset } from '../../lib/liens';
import type { Pole, Prestation } from '../../lib/types';
import { useSession } from '../session';
import { PhotoPole } from '../../shared/PhotoPole';
import { useChargement } from '../useChargement';
import { Bouton, Champ, classeChamp, EnTete, EtatChargement, Message } from '../ui';

/** Champs texte du pôle : libellé, longueur maximale (identique à la validation de l'API) et multiligne. */
const CHAMPS: { cle: keyof Pole; libelle: string; max: number; aide: string; multiligne?: boolean }[] = [
  { cle: 'nom', libelle: 'Nom du pôle', max: 80, aide: 'Titre de la carte et de la fiche.' },
  { cle: 'resume', libelle: 'Résumé', max: 160, aide: 'Une ligne, affichée sous le schéma de l’accueil.' },
  { cle: 'accroche', libelle: 'Accroche', max: 300, aide: 'Texte de la carte du pôle.', multiligne: true },
  { cle: 'introduction', libelle: 'Présentation détaillée', max: 1000, aide: 'Texte de la fiche détaillée.', multiligne: true },
  { cle: 'engagement', libelle: 'Notre engagement', max: 300, aide: 'Encadré en bas de la fiche.', multiligne: true },
];

export function EditionPole() {
  const { id } = useParams();
  const { donnees, erreur, chargement, recharger } = useChargement(() => api<{ pole: Pole }>(`/admin/poles/${id}`), [id]);

  return (
    <>
      <Link to="/admin/poles" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-encre hover:text-navy">
        <ArrowLeft size={16} aria-hidden />Tous les pôles
      </Link>
      {!donnees ? (
        <><EnTete titre="Pôle" /><EtatChargement chargement={chargement} erreur={erreur} onReessayer={recharger} /></>
      ) : (
        <FormulairePole key={donnees.pole.id} initial={donnees.pole} />
      )}
    </>
  );
}

function FormulairePole({ initial }: { initial: Pole }) {
  const { siSessionExpiree } = useSession();
  const [pole, setPole] = useState(initial);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [etat, setEtat] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [televersement, setTeleversement] = useState(false);
  const fichierRef = useRef<HTMLInputElement>(null);

  const modifier = <K extends keyof Pole>(cle: K, valeur: Pole[K]) => {
    setPole((p) => ({ ...p, [cle]: valeur }));
    setEtat(null);
  };
  const modifierPrestation = (index: number, cle: keyof Prestation, valeur: string) =>
    modifier('prestations', pole.prestations.map((s, i) => (i === index ? { ...s, [cle]: valeur } : s)));
  const deplacer = (index: number, sens: -1 | 1) => {
    const liste = [...pole.prestations];
    [liste[index], liste[index + sens]] = [liste[index + sens], liste[index]];
    modifier('prestations', liste);
  };

  const gererErreur = (err: unknown) => {
    siSessionExpiree(err);
    const erreur = err as ApiError;
    setErreurs(erreur.champs);
    setEtat({ type: 'erreur', texte: erreur.message });
  };

  const televerser = async (fichier: File | undefined) => {
    if (!fichier) return;
    setTeleversement(true);
    const formulaire = new FormData();
    formulaire.append('image', fichier);
    try {
      const { url } = await api<{ url: string }>('/admin/images', { method: 'POST', body: formulaire });
      modifier('image', url);
      setErreurs(({ image: _, ...reste }) => reste);
    } catch (err) {
      gererErreur(err);
    } finally {
      setTeleversement(false);
      if (fichierRef.current) fichierRef.current.value = '';
    }
  };

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setEtat(null);
    try {
      const { pole: enregistre } = await api<{ pole: Pole }>(`/admin/poles/${pole.id}`, { method: 'PUT', body: pole });
      setPole(enregistre);
      setErreurs({});
      setEtat({ type: 'succes', texte: 'Pôle enregistré. Les modifications sont visibles sur le site.' });
    } catch (err) {
      gererErreur(err);
    } finally {
      setEnvoi(false);
    }
  };

  const attrs = (cle: string) => ({
    id: `f-${cle}`,
    'aria-invalid': erreurs[cle] ? true : undefined,
    'aria-describedby': erreurs[cle] ? `f-${cle}-err` : undefined,
    className: classeChamp,
  });

  return (
    <form onSubmit={enregistrer} noValidate>
      <EnTete
        titre={initial.nom}
        actions={<img src={asset(`pole-${pole.slug}.png`)} alt="" className="hidden h-12 w-12 object-contain sm:block" />}
      />

      <div className="space-y-6 pb-24">
        <section className="rounded-[24px] bg-white p-5 ring-1 ring-ligne sm:p-7">
          <h2 className="font-display text-lg font-extrabold">Présentation</h2>
          <div className="mt-5 grid gap-5">
            {CHAMPS.map(({ cle, libelle, max, aide, multiligne }) => {
              const valeur = String(pole[cle]);
              return (
                <Champ key={cle} id={`f-${cle}`} libelle={libelle} requis aide={`${aide} ${valeur.length} / ${max} caractères.`} erreur={erreurs[cle]}>
                  {multiligne
                    ? <textarea {...attrs(cle)} rows={cle === 'introduction' ? 4 : 2} maxLength={max} value={valeur} onChange={(e) => modifier(cle, e.target.value as never)} />
                    : <input {...attrs(cle)} maxLength={max} value={valeur} onChange={(e) => modifier(cle, e.target.value as never)} />}
                </Champ>
              );
            })}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-perle px-4 py-3">
              <input type="checkbox" checked={pole.actif} onChange={(e) => modifier('actif', e.target.checked)} className="h-5 w-5 accent-navy" />
              <span>
                <span className="block text-sm font-semibold">Afficher ce pôle sur le site</span>
                <span className="block text-xs text-encre">Décochez pour le masquer temporairement sans perdre son contenu.</span>
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-5 ring-1 ring-ligne sm:p-7">
          <h2 className="font-display text-lg font-extrabold">Photo</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-[240px_1fr]">
            <div className="overflow-hidden rounded-2xl">
              <PhotoPole key={pole.image} pole={pole} loading="eager" className="aspect-[4/3] w-full" />
            </div>
            <div className="grid content-start gap-4">
              <div>
                <input ref={fichierRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="f-fichier" onChange={(e) => televerser(e.target.files?.[0])} />
                <div className="flex flex-wrap gap-2">
                  <Bouton variante="secondaire" disabled={televersement} onClick={() => fichierRef.current?.click()}>
                    <UploadSimple size={18} aria-hidden />
                    {televersement ? 'Envoi de la photo…' : pole.image ? 'Remplacer la photo' : 'Ajouter une photo'}
                  </Bouton>
                  {pole.image && (
                    <Bouton variante="danger" disabled={televersement} onClick={() => { modifier('image', ''); modifier('imageAlt', ''); }}>
                      <Trash size={18} aria-hidden />Retirer la photo
                    </Bouton>
                  )}
                </div>
                <p className="mt-2 text-xs text-encre">
                  JPG, PNG ou WebP, 4 Mo maximum, format paysage conseillé. Sans photo, le site affiche le pictogramme du pôle.
                </p>
                {erreurs.image && <p className="mt-1 text-sm font-medium text-rouge-fonce">{erreurs.image}</p>}
              </div>
              {pole.image && (
                <Champ id="f-imageAlt" libelle="Description de la photo" requis aide="Lue par les lecteurs d’écran et les moteurs de recherche." erreur={erreurs.imageAlt}>
                  <input {...attrs('imageAlt')} maxLength={200} value={pole.imageAlt} onChange={(e) => modifier('imageAlt', e.target.value)} />
                </Champ>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[24px] bg-white p-5 ring-1 ring-ligne sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-extrabold">Prestations</h2>
            <span className="text-sm text-encre">{pole.prestations.length} / 12</span>
          </div>
          {erreurs.prestations && <p className="mt-2 text-sm font-medium text-rouge-fonce">{erreurs.prestations}</p>}
          <ol className="mt-5 space-y-3">
            {pole.prestations.map((s, i) => (
              <li key={i} className="rounded-2xl border border-ligne p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-encre">Prestation {i + 1}</span>
                  <span className="flex gap-1">
                    <Bouton variante="secondaire" className="h-9 w-9 px-0" disabled={i === 0} onClick={() => deplacer(i, -1)} aria-label={`Monter la prestation ${i + 1}`}><ArrowUp size={16} aria-hidden /></Bouton>
                    <Bouton variante="secondaire" className="h-9 w-9 px-0" disabled={i === pole.prestations.length - 1} onClick={() => deplacer(i, 1)} aria-label={`Descendre la prestation ${i + 1}`}><ArrowDown size={16} aria-hidden /></Bouton>
                    <Bouton variante="danger" className="h-9 w-9 px-0" disabled={pole.prestations.length === 1} onClick={() => modifier('prestations', pole.prestations.filter((_, j) => j !== i))} aria-label={`Supprimer la prestation ${i + 1}`}><Trash size={16} aria-hidden /></Bouton>
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                  <Champ id={`f-prestations.${i}.titre`} libelle="Titre (fiche détaillée)" requis erreur={erreurs[`prestations.${i}.titre`]}>
                    <input {...attrs(`prestations.${i}.titre`)} maxLength={150} value={s.titre} onChange={(e) => modifierPrestation(i, 'titre', e.target.value)} />
                  </Champ>
                  <Champ id={`f-prestations.${i}.libelleCourt`} libelle="Étiquette (carte)" requis erreur={erreurs[`prestations.${i}.libelleCourt`]}>
                    <input {...attrs(`prestations.${i}.libelleCourt`)} maxLength={60} value={s.libelleCourt} onChange={(e) => modifierPrestation(i, 'libelleCourt', e.target.value)} />
                  </Champ>
                  <Champ id={`f-prestations.${i}.description`} libelle="Description" requis erreur={erreurs[`prestations.${i}.description`]} className="sm:col-span-2">
                    <input {...attrs(`prestations.${i}.description`)} maxLength={300} value={s.description} onChange={(e) => modifierPrestation(i, 'description', e.target.value)} />
                  </Champ>
                </div>
              </li>
            ))}
          </ol>
          <Bouton variante="secondaire" className="mt-4" disabled={pole.prestations.length >= 12} onClick={() => modifier('prestations', [...pole.prestations, { titre: '', libelleCourt: '', description: '' }])}>
            <Plus size={18} aria-hidden />Ajouter une prestation
          </Bouton>
        </section>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-[0_20px_40px_-20px_rgb(0_19_78/.45)] ring-1 ring-ligne sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">{etat ? <Message type={etat.type}>{etat.texte}</Message> : <p className="px-2 text-sm text-encre">Les modifications sont publiées dès l’enregistrement.</p>}</div>
        <Bouton type="submit" disabled={envoi || televersement}>{envoi ? 'Enregistrement…' : 'Enregistrer le pôle'}</Bouton>
      </div>
    </form>
  );
}
