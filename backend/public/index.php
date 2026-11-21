<?php
declare(strict_types=1);

/**
 * Contrôleur frontal unique : toutes les requêtes passent par ici (voir .htaccess).
 *   /api/...                   → routeur et contrôleurs de l'API (réponses JSON)
 *   /robots.txt, /sitemap.xml  → fichiers pour les moteurs de recherche
 *   le reste                   → application React (site public et panel /admin)
 */

use App\Controllers\AppController;
use App\Controllers\SeoController;
use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;

require dirname(__DIR__) . '/app/bootstrap.php';

Response::securityHeaders();
$request = Request::fromGlobals();

if ($request->path === '/robots.txt') {
    (new SeoController($request))->robots();
}
if ($request->path === '/sitemap.xml') {
    (new SeoController($request))->sitemap();
}
if (!str_starts_with($request->path, '/api')) {
    (new AppController($request))->page();
}

try {
    $router = new Router();
    (require BASE_PATH . '/config/routes.php')($router);
    $router->dispatch($request);
} catch (HttpException $e) {
    Response::error($e);
} catch (\Throwable $e) {
    error_log('Erreur API : ' . $e); // détail dans storage/logs/app.log, jamais renvoyé au visiteur
    $message = App\Core\Config::get('debug') ? $e->getMessage() : 'Une erreur est survenue. Réessayez dans un instant.';
    Response::error(new HttpException(500, 'erreur_serveur', $message));
}
