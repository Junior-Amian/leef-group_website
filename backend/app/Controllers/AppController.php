<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Response;
use App\Core\View;
use App\Services\Seo;

/**
 * Sert l'application React (site public et panel /admin).
 * Pour le site public, le contenu et les balises SEO sont injectés dans la page :
 * affichage immédiat sans écran de chargement ; titre, description, adresse canonique
 * et données structurées lisibles par les moteurs de recherche et les réseaux sociaux.
 */
final class AppController extends Controller
{
    /**
     * Ressources autorisées dans la page. %s = nonce des scripts injectés.
     * img-src https: : photos des pôles hébergées ailleurs (adresse https saisie dans le panel).
     * frame-src : carte OpenStreetMap de la section Contact.
     */
    private const CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self' 'nonce-%s'; style-src 'self'; "
        . "img-src 'self' https: data: blob:; font-src 'self' data:; connect-src 'self'; "
        . "frame-src https://www.openstreetmap.org; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";

    public function page(): never
    {
        $html = @file_get_contents(BASE_PATH . '/public/app/index.html');
        if ($html === false) {
            Response::html('Application non construite : lancer « npm run build » dans frontend/.', 500);
        }

        $isAdmin = $this->request->path === '/admin' || str_starts_with($this->request->path, '/admin/');
        $content = null;
        if (!$isAdmin) {
            try {
                $content = SiteController::content();
            } catch (\Throwable $e) {
                error_log('Page publique sans contenu injecté : ' . $e->getMessage()); // l'application réessaiera via l'API
            }
        }
        $page = $isAdmin ? Seo::admin() : Seo::forPath($this->request->path, $content);

        // Nonce à usage unique : seuls les scripts injectés par le serveur peuvent s'exécuter en ligne.
        $nonce = base64_encode(random_bytes(16));
        header('Content-Security-Policy: ' . sprintf(self::CONTENT_SECURITY_POLICY, $nonce));

        $head = View::render('app-head', [
            'page'    => $page,
            'content' => $page['status'] === 200 ? $content : null, // la page 404 n'a pas besoin du contenu
            'nonce'   => $nonce,
        ]);
        // Callback : un « $0 » ou « \1 » dans le titre saisi au panel reste du texte (pas une référence de regex).
        $html = preg_replace_callback('#<title>.*?</title>#s', static fn (): string => '<title>' . View::e($page['title']) . '</title>', $html, 1);
        Response::html(str_replace('</head>', $head . '</head>', (string) $html), $page['status']);
    }
}
