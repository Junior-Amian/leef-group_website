<?php
// Copier ce fichier en config.php et l'adapter à l'environnement.
// config.php n'est jamais versionné : il contient les accès à la base.
return [
    'db' => [
        'dsn'      => 'mysql:host=127.0.0.1;port=3306;dbname=leef_group;charset=utf8mb4',
        // Production : utilisateur dédié avec les seuls droits SELECT, INSERT, UPDATE, DELETE sur la base.
        'user'     => 'leef',
        'password' => 'à-remplacer',
    ],
    // true uniquement en local : affiche le message des erreurs serveur dans les réponses de l'API.
    'debug' => false,
    // Site servi en HTTPS (production) : cookie de session toujours « Secure » et en-tête HSTS.
    // Laisser à true même derrière un proxy ou Cloudflare ; false seulement en local sans certificat.
    'https' => true,
    // Adresse publique du site, sans « / » final. Sert au référencement : adresse canonique des pages,
    // image de partage sur les réseaux sociaux, données structurées, robots.txt et sitemap.xml.
    // Valeur d'exemple : à remplacer par le domaine définitif avant la mise en ligne.
    'site_url' => 'https://leef-group.com',
    // Expéditeur des notifications (adresse du domaine du site, sinon les e-mails risquent le spam).
    'mail_from' => 'no-reply@leef-group.com',
];
