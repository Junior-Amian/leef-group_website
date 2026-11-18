<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Core\HttpException;
use App\Core\Request;

/**
 * Refuse toute écriture (POST, PUT, PATCH, DELETE) envoyée depuis un autre site.
 * Le navigateur ajoute l'en-tête Origin sur ces requêtes : il doit correspondre à l'hôte du site.
 */
final class SameOrigin implements Middleware
{
    public function handle(Request $request): void
    {
        if (!$request->isWrite()) {
            return;
        }
        $origin = $request->header('Origin');
        if ($origin === '') {
            return; // client non navigateur (curl…) : aucun cookie de session ne peut être abusé
        }
        $port = parse_url($origin, PHP_URL_PORT);
        $originHost = parse_url($origin, PHP_URL_HOST) . ($port ? ":{$port}" : '');
        if (!hash_equals($request->host(), $originHost)) {
            throw HttpException::forbidden();
        }
    }
}
