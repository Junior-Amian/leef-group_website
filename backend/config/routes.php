<?php
declare(strict_types=1);

/**
 * Routes de l'API (/api/...). Toute autre URL sert l'application React (AppController).
 *
 * Middlewares :
 *   SameOrigin   : toute écriture doit venir du site lui-même (toutes les routes)
 *   Authenticate : session administrateur obligatoire
 *   VerifyCsrf   : jeton X-CSRF-Token obligatoire sur les écritures du panel
 */

use App\Controllers\Admin\ImageController;
use App\Controllers\Admin\PoleController;
use App\Controllers\Admin\ProposalController as AdminProposalController;
use App\Controllers\Admin\SettingController;
use App\Controllers\AuthController;
use App\Controllers\ProposalController;
use App\Controllers\SiteController;
use App\Core\Router;
use App\Middleware\Authenticate;
use App\Middleware\SameOrigin;
use App\Middleware\VerifyCsrf;

return static function (Router $router): void {
    $router->group('/api', [SameOrigin::class], static function (Router $r): void {
        // Site public
        $r->get('/site', [SiteController::class, 'show']);
        $r->post('/propositions', [ProposalController::class, 'store']);

        // Session du panel
        $r->post('/session', [AuthController::class, 'login']);
        $r->group('', [Authenticate::class, VerifyCsrf::class], static function (Router $r): void {
            $r->get('/session', [AuthController::class, 'show']);
            $r->delete('/session', [AuthController::class, 'logout']);
        });

        // Panel d'administration
        $r->group('/admin', [Authenticate::class, VerifyCsrf::class], static function (Router $r): void {
            $r->get('/parametres', [SettingController::class, 'index']);
            $r->put('/parametres', [SettingController::class, 'update']);

            $r->get('/poles', [PoleController::class, 'index']);
            $r->get('/poles/{id}', [PoleController::class, 'show']);
            $r->put('/poles/{id}', [PoleController::class, 'update']);

            $r->post('/images', [ImageController::class, 'store']);

            $r->get('/propositions', [AdminProposalController::class, 'index']);
            $r->patch('/propositions/{id}', [AdminProposalController::class, 'update']);
            $r->delete('/propositions/{id}', [AdminProposalController::class, 'destroy']);
        });
    });
};
