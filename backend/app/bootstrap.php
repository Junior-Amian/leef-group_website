<?php
declare(strict_types=1);

/**
 * Amorçage commun (contrôleur frontal et scripts en ligne de commande) :
 * chargement automatique des classes App\..., configuration, journal d'erreurs.
 */

define('BASE_PATH', dirname(__DIR__));

spl_autoload_register(static function (string $class): void {
    if (str_starts_with($class, 'App\\')) {
        $file = BASE_PATH . '/app/' . str_replace('\\', '/', substr($class, 4)) . '.php';
        if (is_file($file)) {
            require $file;
        }
    }
});

$configFile = BASE_PATH . '/config/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    exit('Configuration manquante : copier config/config.example.php en config/config.php.');
}
App\Core\Config::load(require $configFile);

date_default_timezone_set('Africa/Abidjan');
error_reporting(E_ALL);
ini_set('display_errors', '0');          // jamais d'erreur affichée au visiteur
ini_set('log_errors', '1');
ini_set('error_log', BASE_PATH . '/storage/logs/app.log'); // hors de la racine web
