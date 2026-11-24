-- Mise à jour d'une base existante : ajout de la mesure d'audience (tableau de bord du panel).
-- À exécuter une fois :  mysql -u <utilisateur> -p <base> < migration-2026-11-statistiques.sql
-- (Inutile sur une base créée avec le schema.sql actuel, qui contient déjà ces tables.)

SET NAMES utf8mb4;

-- Mesure d'audience anonyme du site public (voir app/Models/Visit.php) : une ligne par page vue.
-- Ni adresse IP, ni navigateur, ni heure : la date, la page, le site d'origine et le type d'appareil.
CREATE TABLE IF NOT EXISTS visites (
  id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  jour     DATE         NOT NULL,
  chemin   VARCHAR(120) NOT NULL,                     -- / ou /poles/{slug}
  entree   TINYINT(1)   NOT NULL DEFAULT 0,           -- 1 = première page vue en arrivant sur le site
  source   VARCHAR(100) NOT NULL DEFAULT '',          -- domaine d'origine de l'arrivée ; vide = accès direct
  appareil ENUM('mobile', 'tablette', 'ordinateur') NOT NULL,
  visiteur CHAR(16)     NOT NULL,                     -- empreinte valable un seul jour (sel quotidien)
  INDEX idx_visites_jour (jour, visiteur),
  INDEX idx_visites_chemin (jour, chemin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sel du jour servant à calculer l'empreinte des visiteurs ; celui de la veille est supprimé.
CREATE TABLE IF NOT EXISTS sels_visites (
  jour DATE     PRIMARY KEY,
  sel  CHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
