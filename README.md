# LEEF GROUP — site internet

Site vitrine de LEEF GROUP (groupe multisectoriel, Abidjan) et son panel d’administration.

- **Démo du site vitrine** (statique, sans panel) : https://junior-amian.github.io/leef-group_website/
- **Site complet** (avec panel `/admin`) : à déployer sur un hébergement PHP + MySQL, voir [Déploiement](#déploiement).

| Dossier | Contenu |
|---|---|
| `frontend/` | React 18 + TypeScript + Tailwind (Vite) : site public et panel d’administration |
| `backend/` | API PHP 8 en MVC, sans framework, et base MySQL |
| `img/` | Logos et visuels d’origine fournis par LEEF GROUP |
| `docs/ARCHITECTURE.md` | Choix d’architecture, sécurité, conventions |

## Prérequis

- PHP 8.1 ou plus, avec les extensions `pdo_mysql`, `fileinfo`, `mbstring`
- MySQL 5.7+ ou MariaDB 10.3+
- Node.js 20 ou plus (uniquement pour construire le front)

## Installation locale

```bash
# 1. Base de données
mysql -u root -e "CREATE DATABASE leef_group CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root leef_group < backend/database/schema.sql
mysql -u root leef_group < backend/database/seed.sql

# 2. Configuration de l'API
cp backend/config/config.example.php backend/config/config.php   # puis renseigner les accès à la base

# 3. Compte administrateur (mot de passe de 12 caractères minimum, demandé à l'écran)
php backend/bin/creer-admin.php vous@leef-group.com

# 4. Front
cd frontend && npm install
```

## Développement

Deux terminaux :

```bash
# API PHP sur http://127.0.0.1:8000
cd backend && php -S 127.0.0.1:8000 -t public router-dev.php

# Front avec rechargement à chaud sur http://localhost:5173 (le site) et /admin (le panel)
cd frontend && npm run dev
```

Vite redirige `/api` et `/uploads` vers l’API PHP.

## Déploiement

### Site complet (hébergement PHP + MySQL)

1. Construire le front : `cd frontend && npm run build` (le résultat est écrit dans `backend/public/app/`).
2. Envoyer le dossier `backend/` sur l’hébergement. **Seul `backend/public/` doit être la racine web** (document root) : `app/`, `config/`, `database/` et `storage/` restent hors de portée des visiteurs.
3. Créer la base et y charger `schema.sql` puis `seed.sql` ; créer un utilisateur MySQL dédié avec les seuls droits `SELECT, INSERT, UPDATE, DELETE`.
4. Créer `backend/config/config.php` à partir de `config.example.php` (`debug` à `false`).
5. Créer le compte administrateur : `php bin/creer-admin.php …`
6. Activer HTTPS, puis décommenter la redirection HTTPS dans `backend/public/.htaccess`.
7. Vérifier que `backend/public/uploads/` et `backend/storage/logs/` sont accessibles en écriture par PHP.

### Démo GitHub Pages (site vitrine statique)

À chaque push sur `main`, le workflow `.github/workflows/pages.yml` construit le site en mode démo et le publie sur la branche `gh-pages`.

- Le contenu vient de `frontend/public/contenu-demo.json`, un instantané de l’API. Pour le mettre à jour (API locale lancée) : `cd frontend && npm run demo:contenu`.
- La démo n’a ni panel ni envoi de formulaire : le formulaire de partenariat l’indique et renvoie vers WhatsApp.
- Construction manuelle : `npm run build:pages` (résultat dans `frontend/dist-pages/`).

## Panel d’administration

`/admin` : propositions de partenariat reçues, textes et coordonnées du site, contenu et photo des six pôles. Sans photo, un pôle affiche un placeholder (pictogramme officiel, « Photo à venir »).
