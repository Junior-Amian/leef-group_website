<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;

/** Contrôle exécuté avant l'action ; lève une HttpException pour interrompre la requête. */
interface Middleware
{
    public function handle(Request $request): void;
}
