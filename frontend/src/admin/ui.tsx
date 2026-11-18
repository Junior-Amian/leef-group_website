import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';

/** Composants d'interface du panel (style sobre, cohérent avec la charte). */

type Variante = 'principal' | 'secondaire' | 'danger';

const VARIANTES: Record<Variante, string> = {
  principal: 'bg-navy text-white hover:bg-navy-800',
  secondaire: 'bg-white text-navy ring-1 ring-ligne hover:ring-navy/40',
  danger: 'bg-white text-rouge-fonce ring-1 ring-ligne hover:bg-rouge hover:text-white hover:ring-rouge',
};

export function Bouton({ variante = 'principal', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-[background-color,color,box-shadow,transform] active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]} ${className}`}
    />
  );
}

/** Champ de formulaire : libellé, contrôle, aide et erreur. Le contrôle reçoit l'id via `id`. */
export function Champ({ id, libelle, requis, aide, erreur, children, className = '' }: {
  id: string; libelle: string; requis?: boolean; aide?: string; erreur?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={`grid min-w-0 gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">
        {libelle} {requis && <span className="text-rouge" aria-hidden="true">*</span>}
      </label>
      {children}
      {aide && !erreur && <p className="text-xs text-encre">{aide}</p>}
      {erreur && <p id={`${id}-err`} className="text-sm font-medium text-rouge-fonce">{erreur}</p>}
    </div>
  );
}

/** Classes communes aux champs texte du panel. */
export const classeChamp =
  'w-full rounded-xl border border-ligne bg-white px-3.5 py-2.5 text-[15px] outline-none transition focus:border-navy focus:ring-4 focus:ring-navy/10 aria-[invalid=true]:border-rouge-fonce aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-rouge/10';

export function Message({ type, children }: { type: 'succes' | 'erreur'; children: ReactNode }) {
  const succes = type === 'succes';
  const Icone = succes ? CheckCircle : WarningCircle;
  return (
    <p role={succes ? 'status' : 'alert'} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${succes ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-rouge-fonce'}`}>
      <Icone size={18} className="mt-px shrink-0" aria-hidden />
      {children}
    </p>
  );
}

export function EnTete({ titre, description, actions }: { titre: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.025em]">{titre}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-encre">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

/** États de chargement et d'erreur communs aux pages du panel. */
export function EtatChargement({ chargement, erreur, onReessayer }: { chargement: boolean; erreur: string; onReessayer: () => void }) {
  if (chargement) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Chargement">
        {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white ring-1 ring-ligne" />)}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Message type="erreur">{erreur}</Message>
      <Bouton variante="secondaire" onClick={onReessayer}>Réessayer</Bouton>
    </div>
  );
}
