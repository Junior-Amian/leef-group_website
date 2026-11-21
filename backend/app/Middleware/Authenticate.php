<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Session;
use App\Models\Admin;

/**
 * Exige une session administrateur ouverte et toujours valable :
 * le compte doit exister et son mot de passe ne doit pas avoir changé depuis la connexion.
 */
final class Authenticate implements Middleware
{
    public function handle(Request $request): void
    {
        if (!Session::exists()) {
            throw HttpException::unauthorized();
        }
        Session::start($request);
        $admin = Session::get('admin');
        if (!is_array($admin)) {
            throw HttpException::unauthorized();
        }
        $current = Admin::sessionFingerprint((int) $admin['id']);
        $stored = Session::get('admin_empreinte');
        if ($current === null || !is_string($stored) || !hash_equals($current, $stored)) {
            Session::destroy();
            throw HttpException::unauthorized('Votre session n’est plus valable. Reconnectez-vous.');
        }
    }
}
