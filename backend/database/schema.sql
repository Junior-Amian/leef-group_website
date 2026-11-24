-- LEEF GROUP : schéma de la base (MySQL 5.7+ / MariaDB 10.3+).
-- À exécuter une fois sur une base vide :  mysql -u <utilisateur> -p <base> < schema.sql

SET NAMES utf8mb4;

-- Comptes du panel d'administration.
CREATE TABLE admins (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email             VARCHAR(190) NOT NULL UNIQUE,
  mot_de_passe_hash VARCHAR(255) NOT NULL,
  cree_le           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Textes et coordonnées éditables. Les clés autorisées sont définies dans backend/src/Parametres.php.
CREATE TABLE parametres (
  cle    VARCHAR(100) PRIMARY KEY,
  valeur TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les six pôles d'activité (contenu éditable, liste fixe).
CREATE TABLE poles (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug         VARCHAR(40)  NOT NULL UNIQUE,          -- sert aussi à retrouver le pictogramme officiel
  nom          VARCHAR(80)  NOT NULL,
  resume       VARCHAR(160) NOT NULL,                 -- une ligne, sous le schéma du hero
  accroche     VARCHAR(300) NOT NULL,                 -- texte de la carte
  introduction TEXT         NOT NULL,                 -- texte de la fiche détaillée
  engagement   VARCHAR(300) NOT NULL,
  image        VARCHAR(500) NOT NULL DEFAULT '',      -- chemin /uploads/... ou URL https ; vide = placeholder
  image_alt    VARCHAR(200) NOT NULL DEFAULT '',
  ordre        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  actif        TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE prestations (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pole_id       INT UNSIGNED NOT NULL,
  titre         VARCHAR(150) NOT NULL,                -- affiché dans la fiche
  libelle_court VARCHAR(60)  NOT NULL,                -- étiquette sur la carte
  description   VARCHAR(300) NOT NULL,
  ordre         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_prestations_pole FOREIGN KEY (pole_id) REFERENCES poles(id) ON DELETE CASCADE,
  INDEX idx_prestations_pole (pole_id, ordre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Propositions de partenariat envoyées depuis le site.
CREATE TABLE propositions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profil       ENUM('entreprise', 'institution', 'investisseur', 'technique') NOT NULL,
  organisation VARCHAR(150) NOT NULL,
  nom          VARCHAR(150) NOT NULL,
  email        VARCHAR(190) NOT NULL,
  pole         VARCHAR(80)  NOT NULL,
  message      TEXT         NOT NULL,
  ip           VARCHAR(45)  NOT NULL,                 -- limite d'envoi par adresse (anti-spam)
  lue          TINYINT(1)   NOT NULL DEFAULT 0,
  cree_le      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_propositions_date (cree_le),
  INDEX idx_propositions_ip (ip, cree_le)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Échecs de connexion au panel, par adresse IP (blocage temporaire après 5 échecs).
CREATE TABLE tentatives_connexion (
  ip       VARCHAR(45) PRIMARY KEY,
  nombre   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  derniere DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mesure d'audience anonyme du site public (voir app/Models/Visit.php) : une ligne par page vue.
-- Ni adresse IP, ni navigateur, ni heure : la date, la page, le site d'origine et le type d'appareil.
CREATE TABLE visites (
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
CREATE TABLE sels_visites (
  jour DATE     PRIMARY KEY,
  sel  CHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
