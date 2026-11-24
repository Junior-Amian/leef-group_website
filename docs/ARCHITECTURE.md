# Architecture

Site d’une page (site public) et panel d’administration, servis par une API PHP sans framework.
Principe directeur : la solution la plus simple qui couvre le besoin réel (KISS, YAGNI), une seule source pour chaque règle (DRY).

## Vue d’ensemble

```
Navigateur ──► backend/public/index.php (contrôleur frontal unique)
                 ├─ /api/...  → Router → Middleware → Controller → Model → MySQL   (JSON)
                 └─ le reste  → AppController : page React + contenu injecté        (HTML)
```

- **Site public** : `index.php` injecte le contenu (`window.__SITE__`) et les balises SEO dans la page React. Le site s’affiche donc sans écran de chargement et reste lisible par les moteurs de recherche, sans rendu côté serveur à maintenir.
- **Panel** (`/admin`) : chargé à la demande (chunk séparé), il dialogue avec l’API en JSON.

## Back-end : MVC en PHP pur

| Couche | Rôle | Fichiers |
|---|---|---|
| `Core/` | Socle : routeur, requête, réponse, base de données, session, validation, vue | `Router`, `Request`, `Response`, `Database`, `Session`, `Validator`, `View`, `HttpException`, `Controller` |
| `Middleware/` | Contrôles avant l’action | `SameOrigin`, `Authenticate`, `VerifyCsrf` |
| `Models/` | Accès aux données et règles de validation de chaque ressource | `Setting`, `Pole`, `Proposal`, `Visit`, `Admin`, `LoginAttempt` |
| `Controllers/` | Lisent la requête, appellent les modèles, renvoient la réponse | `Site`, `App`, `Proposal`, `Visit`, `Auth`, `Admin/*` |
| `Services/` | Effets externes | `ImageUploader`, `ProposalNotifier` |
| `Views/` | Gabarit HTML | `app-head.php` |

Routes : `backend/config/routes.php`. Toutes les erreurs suivent le même format :
`{ "erreur": { "code": "...", "message": "...", "champs": { "email": "..." } } }`.

## Données

Tables : `parametres` (clé/valeur), `poles`, `prestations`, `propositions`, `visites`, `sels_visites`, `admins`, `tentatives_connexion` (voir `database/schema.sql` ; une base existante se met à jour avec `database/migration-*.sql`).

- **Source unique des paramètres éditables** : `Models/Setting::DEFINITIONS` (clé, libellé, type, longueur maximale). L’API renvoie ces définitions et le panel génère son formulaire à partir d’elles : ajouter un paramètre côté serveur l’ajoute au panel sans autre modification.
- **Validation** côté serveur uniquement (une seule source de règles) ; le front affiche les erreurs par champ renvoyées en 422.
- **Photos** facultatives : sans photo, un placeholder est affiché (`frontend/src/shared/PhotoPole.tsx`).

## Sécurité

- Requêtes préparées partout (PDO, émulation désactivée).
- Session : cookie `httpOnly`, `SameSite=Strict`, `Secure` en HTTPS (toujours si `https` vaut `true` dans la configuration), mode strict, expiration après 2 h d’inactivité et 12 h au total, nouvel identifiant à la connexion. À chaque requête du panel, le compte est relu en base : une session est refusée si le compte a été supprimé ou si son mot de passe a changé depuis la connexion.
- CSRF : jeton par session exigé en en-tête `X-CSRF-Token` sur toute écriture du panel, et contrôle de l’en-tête `Origin` sur toutes les écritures.
- Connexion : mots de passe hachés (`password_hash`), temps de réponse identique que l’e-mail existe ou non. Limites comptées avant la vérification du mot de passe (atomique) : 5 essais par adresse en 15 minutes et 30 par compte en 60 minutes. Une adresse IPv6 compte pour son préfixe /64 (`Request::rateLimitKey`).
- Formulaire public : validation en liste blanche (e-mails sans `? & = % / #`), piège à robots, 5 envois par heure et par adresse ; au-delà de 20 propositions par heure sur le site, l’e-mail de notification est suspendu (la proposition reste enregistrée).
- Uploads : type réel lu dans le fichier (`finfo` et `getimagesize`), 4 Mo maximum, nom aléatoire, exécution de scripts interdite dans `uploads/`.
- En-têtes de sécurité, dont Content-Security-Policy (nonce pour le seul script en ligne, `window.__SITE__`) et HSTS quand `https` vaut `true` ; erreurs détaillées uniquement dans `storage/logs/app.log`, hors de la racine web.
- `app/`, `config/`, `database/`, `bin/` et `storage/` contiennent un `.htaccess` qui interdit tout accès, au cas où la racine web serait mal réglée.

## Statistiques (tableau de bord)

- **Collecte** : le site public signale chaque page affichée (`lib/audience.ts`, appelé par `SitePage`) à `POST /api/visites`. Le serveur n'accepte que les pages publiques (`/` et `/poles/{slug}` d'un pôle actif) et ignore les robots, les refus de suivi (`DNT`, `Sec-GPC`) et les administrateurs connectés ; il répond toujours 204.
- **Anonymat** (`Models/Visit`) : une ligne par page vue avec la date (sans l'heure), la page, le domaine d'origine (à l'arrivée seulement) et le type d'appareil. Le visiteur est une empreinte de 16 caractères (HMAC de l'adresse et du navigateur avec un sel aléatoire du jour) ; le sel est supprimé le lendemain. Pas de cookie, donc pas de consentement à recueillir. Données supprimées après 13 mois ; 300 pages vues par visiteur et par jour au plus (gonflage volontaire).
- **Conséquence** : un « visiteur » est compté une fois par jour ; sur une période, c'est la somme des visiteurs quotidiens.
- **Restitution** : `GET /api/admin/statistiques?periode=7|30|90` (`Admin/StatisticsController`) renvoie totaux, période précédente, série par jour, pages, provenances, appareils et propositions ; page `admin/pages/Statistiques.tsx`, courbe en SVG sans bibliothèque.

## Référencement

- **Pages indexables** : l’accueil `/` et une page par pôle actif, `/poles/{slug}` (l’accueil avec la fiche du pôle ouverte). Toute autre adresse publique répond **404** avec `noindex`. Les adresses sont reconnues à l’identique par le serveur (`Services/Seo.php`) et par React (`App.tsx`).
- **Balises servies dans le HTML initial** (sans attendre JavaScript), par `AppController` et `Views/app-head.php` : titre, description (160 caractères au plus), adresse canonique, Open Graph et carte Twitter avec l’image de partage `leef-partage.png` (1200 × 630), et données structurées JSON-LD. Accueil : `WebSite` et `Organization` (contact, siège géolocalisé, pôles). Page d’un pôle : `Service` (prestations) et `BreadcrumbList`.
- **Titres** : accueil = paramètre `seo.titre` du panel ; pôle = « {nom} à Abidjan | LEEF GROUP », même format côté serveur et côté React.
- **`/robots.txt` et `/sitemap.xml`** sont générés par `SeoController` à partir des pôles actifs. Ils exigent `site_url` dans la configuration, comme l’adresse canonique.
- **Liens explorables** : les cartes et le pied de page pointent vers `/poles/{slug}` par de vrais liens. Fermer une fiche revient en arrière si on venait du site, sinon ramène à l’accueil sur la carte du pôle.
- Les réponses de l’API portent `X-Robots-Tag: noindex`. La démo GitHub Pages est en `noindex` (plugin dans `vite.config.ts`).
- **Limite connue** : le texte des sections est affiché par React. Google exécute JavaScript et le voit, mais les robots qui ne l’exécutent pas (la plupart des robots d’IA) ne lisent que les balises et le JSON-LD.

## Front-end

- `site/` : un composant par section ; l’état reste au plus près de son usage (la barre d’action et la navigation observent elles-mêmes la page via `IntersectionObserver`).
- `admin/` : session (contexte), hook `useChargement` pour les cinq pages, composants d’interface dans `ui.tsx`.
- `lib/` : types du contrat de l’API, client HTTP, construction des liens (téléphone, WhatsApp, carte).

## Volontairement exclu (YAGNI)

Actualités et réalisations, création ou suppression de pôles, édition du slogan et des pictogrammes (identité officielle), rôles d’administrateur multiples. Chacun s’ajoutera quand le besoin sera confirmé.

## Conventions

Code technique en anglais (conventions MVC) ; vocabulaire métier (tables, champs JSON, messages, composants du site) en français.
