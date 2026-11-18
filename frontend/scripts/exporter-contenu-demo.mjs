// Exporte le contenu public du site (GET /api/site) vers public/contenu-demo.json,
// utilisé par la démo statique GitHub Pages. L'API PHP doit tourner (voir README).
//   npm run demo:contenu            (API sur http://127.0.0.1:8000 par défaut)
//   API=https://exemple.ci npm run demo:contenu
import { writeFileSync } from 'node:fs';

const api = process.env.API ?? 'http://127.0.0.1:8000';
const reponse = await fetch(`${api}/api/site`);
if (!reponse.ok) {
  console.error(`Échec : ${api}/api/site a répondu ${reponse.status}.`);
  process.exit(1);
}
const contenu = await reponse.json();
writeFileSync(new URL('../public/contenu-demo.json', import.meta.url), JSON.stringify(contenu, null, 2) + '\n');
console.log(`Contenu exporté : ${contenu.poles.length} pôles, ${Object.keys(contenu.parametres).length} paramètres.`);
