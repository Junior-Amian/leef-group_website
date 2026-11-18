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
| `Models/` | Accès aux données et règles de validation de chaque ressource | `Setting`, `Pole`, `Proposal`, `Admin`, `LoginAttempt` |
| `Controllers/` | Lisent la requête, appellent les modèles, renvoient la réponse | `Site`, `App`, `Proposal`, `Auth`, `Admin/*` |
| `Services/` | Effets externes | `ImageUploader`, `ProposalNotifier` |
| `Views/` | Gabarit HTML | `app-head.php` |

Routes : `backend/config/routes.php`. Toutes les erreurs suivent le même format :
`{ "erreur": { "code": "...", "message": "...", "champs": { "email": "..." } } }`.

## Données

Tables : `parametres` (clé/valeur), `poles`, `prestations`, `propositions`, `admins`, `tentatives_connexion` (voir `database/schema.sql`).

- **Source unique des paramètres éditables** : `Models/Setting::DEFINITIONS` (clé, libellé, type, longueur maximale). L’API renvoie ces définitions et le panel génère son formulaire à partir d’elles : ajouter un paramètre côté serveur l’ajoute au panel sans autre modification.
- **Validation** côté serveur uniquement (une seule source de règles) ; le front affiche les erreurs par champ renvoyées en 422.
- **Photos** facultatives : sans photo, un placeholder est affiché (`frontend/src/shared/PhotoPole.tsx`).

## Sécurité

- Requêtes préparées partout (PDO, émulation désactivée).
- Session : cookie `httpOnly`, `SameSite=Strict`, `Secure` en HTTPS, mode strict, expiration après 2 h d’inactivité, nouvel identifiant à la connexion.
- CSRF : jeton par session exigé en en-tête `X-CSRF-Token` sur toute écriture du panel, et contrôle de l’en-tête `Origin` sur toutes les écritures.
- Mots de passe hachés (`password_hash`) ; blocage de l’adresse IP après 5 échecs en 15 minutes.
- Formulaire public : validation en liste blanche, piège à robots, 5 envois par heure et par IP au maximum.
- Uploads : type réel lu dans le fichier (`finfo` et `getimagesize`), 4 Mo maximum, nom aléatoire, exécution de scripts interdite dans `uploads/`.
- En-têtes de sécurité ; erreurs détaillées uniquement dans `storage/logs/app.log`, hors de la racine web.

## Front-end

- `site/` : un composant par section ; l’état reste au plus près de son usage (la barre d’action et la navigation observent elles-mêmes la page via `IntersectionObserver`).
- `admin/` : session (contexte), hook `useChargement` pour les quatre pages, composants d’interface dans `ui.tsx`.
- `lib/` : types du contrat de l’API, client HTTP, construction des liens (téléphone, WhatsApp, carte).

## Volontairement exclu (YAGNI)

Actualités et réalisations, création ou suppression de pôles, édition du slogan et des pictogrammes (identité officielle), rôles d’administrateur multiples. Chacun s’ajoutera quand le besoin sera confirmé.

## Conventions

Code technique en anglais (conventions MVC) ; vocabulaire métier (tables, champs JSON, messages, composants du site) en français.
