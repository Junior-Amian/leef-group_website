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
        $email = is_string($data['email'] ?? null) ? $data['email'] : '';
        $password = is_string($data['motDePasse'] ?? null) ? $data['motDePasse'] : '';
        $addressKey = $this->request->rateLimitKey();

        // Tentative comptée avant la vérification du mot de passe (voir LoginAttempt).
        if (!LoginAttempt::attempt($addressKey, $email)) {
            throw HttpException::tooManyRequests('Trop de tentatives. Réessayez dans ' . LoginAttempt::LOCK_MINUTES . ' minutes.');
        }
        $admin = Admin::verify($email, $password);
        if ($admin === null) {
            throw new HttpException(401, 'identifiants_invalides', 'Adresse e-mail ou mot de passe incorrect.');
        }
        LoginAttempt::clear($addressKey, $email);

        Session::start($this->request);
        Session::regenerate(); // nouvel identifiant (anti-fixation) et nouveau jeton CSRF
        Session::set('admin', $admin);
        Session::set('admin_empreinte', Admin::sessionFingerprint($admin['id'])); // revérifiée par Authenticate
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
