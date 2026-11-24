import { DEMO_STATIQUE } from './api';

/**
 * Signale une page vue à l'API (mesure d'audience anonyme, sans cookie : voir backend/app/Models/Visit.php).
 * Silencieux : une mesure perdue ne doit jamais gêner le visiteur.
 */
let premierePage = true;
let dernierChemin = '';

export function signalerPageVue(chemin: string) {
  if (DEMO_STATIQUE || chemin === dernierChemin) return; // même page signalée deux fois de suite (mode strict de React)
  dernierChemin = chemin;
  const entree = premierePage;
  premierePage = false;

  fetch('/api/visites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // La provenance n'a de sens qu'à l'arrivée : ensuite, la navigation reste dans le site.
    body: JSON.stringify({ chemin, entree, provenance: entree ? document.referrer : '' }),
    credentials: 'same-origin',
    keepalive: true,
  }).catch(() => undefined);
}
