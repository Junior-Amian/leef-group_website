<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\HttpException;
use App\Core\Session;
use App\Models\Admin;
use App\Models\LoginAttempt;

/** Connexion et déconnexion du panel. */
final class AuthController extends Controller
{
    /** POST /api/session */
    public function login(): never
    {
        $data = $this->request->json();
        $ip = $this->request->ip();

        if (LoginAttempt::isLocked($ip)) {
            throw HttpException::tooManyRequests('Trop de tentatives. Réessayez dans ' . LoginAttempt::LOCK_MINUTES . ' minutes.');
        }
        $admin = Admin::verify((string) ($data['email'] ?? ''), (string) ($data['motDePasse'] ?? ''));
        if ($admin === null) {
            LoginAttempt::recordFailure($ip);
            throw new HttpException(401, 'identifiants_invalides', 'Adresse e-mail ou mot de passe incorrect.');
        }
        LoginAttempt::clear($ip);

        Session::start($this->request);
        Session::regenerate(); // nouvel identifiant (anti-fixation) et nouveau jeton CSRF
        Session::set('admin', $admin);
        $this->json(['admin' => $admin, 'csrfToken' => Session::csrfToken()]);
    }

    /** GET /api/session (session déjà vérifiée par le middleware Authenticate) */
    public function show(): never
    {
        $this->json(['admin' => Session::get('admin'), 'csrfToken' => Session::csrfToken()]);
    }

    /** DELETE /api/session */
    public function logout(): never
    {
        Session::destroy();
        $this->noContent();
    }
}
