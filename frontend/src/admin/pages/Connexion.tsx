import { useState, type FormEvent } from 'react';
import { ApiError } from '../../lib/api';
import { asset } from '../../lib/liens';
import { useSession } from '../session';
import { Bouton, Champ, classeChamp, Message } from '../ui';

export function Connexion() {
  const { connecter } = useSession();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur('');
    try {
      await connecter(email, motDePasse);
    } catch (err) {
      setErreur((err as ApiError).message);
      setMotDePasse('');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-perle px-4 py-10">
      <div className="w-full max-w-sm">
        <img src={asset('leef-logo.png')} alt="LEEF GROUP" className="mx-auto h-14 w-auto" />
        <form onSubmit={envoyer} className="mt-8 space-y-5 rounded-[24px] bg-white p-6 shadow-[0_30px_60px_-40px_rgb(0_19_78/.45)] ring-1 ring-ligne sm:p-8">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-[-0.02em]">Administration</h1>
            <p className="mt-1 text-sm text-encre">Connectez-vous pour modifier le site.</p>
          </div>
          {erreur && <Message type="erreur">{erreur}</Message>}
          <Champ id="email" libelle="Adresse e-mail">
            <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={classeChamp} />
          </Champ>
          <Champ id="mot-de-passe" libelle="Mot de passe">
            <input id="mot-de-passe" type="password" autoComplete="current-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className={classeChamp} />
          </Champ>
          <Bouton type="submit" disabled={envoi} className="h-12 w-full">{envoi ? 'Connexion…' : 'Se connecter'}</Bouton>
        </form>
      </div>
    </main>
  );
}
