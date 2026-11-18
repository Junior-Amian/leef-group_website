import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../../lib/api';
import type { DefinitionParametre } from '../../lib/types';
import { useSession } from '../session';
import { useChargement } from '../useChargement';
import { Bouton, Champ, classeChamp, EnTete, EtatChargement, Message } from '../ui';

type Reponse = { valeurs: Record<string, string>; definitions: DefinitionParametre[] };

const TYPES_INPUT: Partial<Record<DefinitionParametre['type'], string>> = { email: 'email', telephone: 'tel', url: 'url', decimal: 'text' };

/**
 * Textes et coordonnées du site. Le formulaire est généré à partir des définitions renvoyées par l'API :
 * ajouter un paramètre côté serveur l'ajoute ici sans autre modification.
 */
export function Contenus() {
  const { siSessionExpiree } = useSession();
  const { donnees, setDonnees, erreur, chargement, recharger } = useChargement(() => api<Reponse>('/admin/parametres'));
  const [modifs, setModifs] = useState<Record<string, string>>({});
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [etat, setEtat] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);

  if (!donnees) return <><EnTete titre="Textes et coordonnées" /><EtatChargement chargement={chargement} erreur={erreur} onReessayer={recharger} /></>;

  const valeur = (cle: string) => modifs[cle] ?? donnees.valeurs[cle] ?? '';
  const modifier = (cle: string, v: string) => {
    setModifs((m) => ({ ...m, [cle]: v }));
    setEtat(null);
  };
  const nbModifs = Object.keys(modifs).length;
  const groupes = [...new Set(donnees.definitions.map((d) => d.groupe))];

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setEtat(null);
    try {
      const { valeurs } = await api<{ valeurs: Record<string, string> }>('/admin/parametres', { method: 'PUT', body: modifs }); // seules les modifications sont envoyées
      setDonnees({ ...donnees, valeurs });
      setModifs({});
      setErreurs({});
      setEtat({ type: 'succes', texte: 'Modifications enregistrées. Elles sont visibles sur le site.' });
    } catch (err) {
      siSessionExpiree(err);
      const erreur = err as ApiError;
      setErreurs(erreur.champs);
      setEtat({ type: 'erreur', texte: erreur.message });
      document.getElementById(`p-${Object.keys(erreur.champs)[0]}`)?.focus();
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <form onSubmit={enregistrer} noValidate>
      <EnTete titre="Textes et coordonnées" description="Textes des sections, coordonnées de contact, réseaux sociaux et référencement." />
      <div className="space-y-6 pb-24">
        {groupes.map((groupe) => (
          <fieldset key={groupe} className="rounded-[24px] bg-white p-5 ring-1 ring-ligne sm:p-7">
            <legend className="sr-only">{groupe}</legend>
            <h2 className="font-display text-lg font-extrabold" aria-hidden="true">{groupe}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {donnees.definitions.filter((d) => d.groupe === groupe).map((d) => {
                const id = `p-${d.cle}`;
                const multiligne = d.type === 'paragraphe' || d.type === 'liste';
                const props = {
                  id,
                  value: valeur(d.cle),
                  maxLength: d.max,
                  'aria-invalid': erreurs[d.cle] ? true : undefined,
                  'aria-describedby': erreurs[d.cle] ? `${id}-err` : undefined,
                  className: classeChamp,
                };
                return (
                  <Champ
                    key={d.cle}
                    id={id}
                    libelle={d.libelle}
                    requis={d.requis}
                    erreur={erreurs[d.cle]}
                    aide={d.max && multiligne ? `${valeur(d.cle).length} / ${d.max} caractères` : d.type === 'url' ? 'Laisser vide pour masquer le lien.' : undefined}
                    className={multiligne ? 'sm:col-span-2' : ''}
                  >
                    {multiligne ? (
                      <textarea {...props} rows={d.type === 'liste' ? 4 : 3} onChange={(e) => modifier(d.cle, e.target.value)} />
                    ) : (
                      <input {...props} type={TYPES_INPUT[d.type] ?? 'text'} onChange={(e) => modifier(d.cle, e.target.value)} />
                    )}
                  </Champ>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {/* Barre d'enregistrement toujours visible */}
      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-[0_20px_40px_-20px_rgb(0_19_78/.45)] ring-1 ring-ligne sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          {etat ? <Message type={etat.type}>{etat.texte}</Message> : <p className="px-2 text-sm text-encre">{nbModifs ? `${nbModifs} modification${nbModifs > 1 ? 's' : ''} non enregistrée${nbModifs > 1 ? 's' : ''}` : 'Aucune modification en cours'}</p>}
        </div>
        <div className="flex gap-2">
          {nbModifs > 0 && <Bouton variante="secondaire" onClick={() => { setModifs({}); setErreurs({}); setEtat(null); }}>Annuler</Bouton>}
          <Bouton type="submit" disabled={envoi || nbModifs === 0}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</Bouton>
        </div>
      </div>
    </form>
  );
}
