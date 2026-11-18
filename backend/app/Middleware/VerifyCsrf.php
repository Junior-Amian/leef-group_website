<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Session;

/**
 * Jeton CSRF : toute écriture du panel doit renvoyer, dans l'en-tête X-CSRF-Token,
 * le jeton remis à la connexion. À placer après Authenticate (la session est déjà ouverte).
 */
final class VerifyCsrf implements Middleware
{
    public function handle(Request $request): void
    {
        if ($request->isWrite() && !hash_equals(Session::csrfToken(), $request->header('X-CSRF-Token'))) {
            throw new HttpException(419, 'jeton_expire', 'Votre session a expiré. Rechargez la page.');
        }
    }
}
