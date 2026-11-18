<?php
// Développement uniquement : reproduit le .htaccess pour le serveur intégré de PHP.
//   php -S 127.0.0.1:8000 -t public router-dev.php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path !== '/' && is_file(__DIR__ . '/public' . $path)) {
    return false; // fichier statique servi directement
}
require __DIR__ . '/public/index.php';
