<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Pole;
use App\Models\Setting;

/** Contenu public du site. */
final class SiteController extends Controller
{
    /** GET /api/site */
    public function show(): never
    {
        $this->json(self::content());
    }

    /** @return array{parametres: array<string, string>, poles: list<array<string, mixed>>} aussi injecté dans la page */
    public static function content(): array
    {
        return ['parametres' => Setting::public(), 'poles' => Pole::all(activeOnly: true)];
    }
}
