<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Core\Session;
use App\Models\Visit;

/**
 * Page vue signalée par le site public (mesure d'audience anonyme, voir Models/Visit).
 * Répond toujours 204 : une page vue écartée (robot, administrateur, page inconnue) n'est pas une erreur pour le visiteur.
 */
final class VisitController extends Controller
{
    /** POST /api/visites : { "chemin": "/poles/transport", "entree": true, "provenance": "https://www.google.com/" } */
    public function store(): never
    {
        $data = $this->request->json();
        $path = is_string($data['chemin'] ?? null) ? $data['chemin'] : '';
        $referrer = is_string($data['provenance'] ?? null) ? $data['provenance'] : '';
        $userAgent = mb_substr($this->request->header('User-Agent'), 0, 500);

        if ($this->isCountable($path, $userAgent)) {
            Visit::record($path, ($data['entree'] ?? false) === true, $this->sourceHost($referrer), $userAgent, $this->request->rateLimitKey());
        }
        $this->noContent();
    }

    private function isCountable(string $path, string $userAgent): bool
    {
        // Refus de suivi exprimé par le navigateur (Do Not Track, Global Privacy Control) : respecté.
        if ($this->request->header('DNT') === '1' || $this->request->header('Sec-GPC') === '1') {
            return false;
        }
        if (Visit::isBot($userAgent) || !$this->isPublicPage($path)) {
            return false;
        }
        return !$this->isAdmin(); // les passages de l'équipe ne faussent pas les chiffres
    }

    /** Mêmes adresses que les pages publiques (Services/Seo) : l'accueil et un pôle actif. */
    private function isPublicPage(string $path): bool
    {
        if ($path === '/') {
            return true;
        }
        if (!preg_match('#^/poles/([a-z0-9-]{1,40})$#', $path, $match)) {
            return false;
        }
        return (bool) Database::query('SELECT 1 FROM poles WHERE slug = ? AND actif = 1', [$match[1]])->fetchColumn();
    }

    private function isAdmin(): bool
    {
        if (!Session::exists()) {
            return false;
        }
        Session::start($this->request);
        return is_array(Session::get('admin'));
    }

    /** Site d'origine réduit à son nom de domaine (« google.com ») ; '' pour un accès direct ou depuis le site lui-même. */
    private function sourceHost(string $referrer): string
    {
        $host = strtolower((string) parse_url($referrer, PHP_URL_HOST));
        $host = preg_replace('/^(www|m)\./', '', $host) ?? '';
        $ownHost = preg_replace('/^www\./', '', strtolower((string) parse_url('//' . $this->request->host(), PHP_URL_HOST))) ?? '';
        if ($host === '' || $host === $ownHost || !preg_match('/^[a-z0-9.-]{1,100}$/', $host)) {
            return '';
        }
        return $host;
    }
}
