<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Response;
use App\Core\View;

/**
 * Sert l'application React (site public et panel /admin).
 * Pour le site public, le contenu et les balises SEO sont injectés dans la page :
 * affichage immédiat sans écran de chargement, titre et description lisibles par les moteurs de recherche.
 */
final class AppController extends Controller
{
    /**
     * Ressources autorisées dans la page. %s = nonce du script injecté.
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

        $isAdmin = str_starts_with($this->request->path, '/admin');
        $content = null;
        if (!$isAdmin) {
            try {
                $content = SiteController::content();
            } catch (\Throwable $e) {
                error_log('Page publique sans contenu injecté : ' . $e->getMessage()); // l'application réessaiera via l'API
            }
        }

        // Nonce à usage unique : seul le script injecté par le serveur (window.__SITE__) peut s'exécuter en ligne.
        $nonce = base64_encode(random_bytes(16));
        header('Content-Security-Policy: ' . sprintf(self::CONTENT_SECURITY_POLICY, $nonce));

        $head = View::render('app-head', ['isAdmin' => $isAdmin, 'content' => $content, 'nonce' => $nonce]);
        $title = $isAdmin ? 'Administration | LEEF GROUP' : ($content['parametres']['seo.titre'] ?? 'LEEF GROUP');
        // Callback : un « $0 » ou « \1 » dans le titre saisi au panel reste du texte (pas une référence de regex).
        $html = preg_replace_callback('#<title>.*?</title>#s', static fn (): string => '<title>' . View::e($title) . '</title>', $html, 1);
        Response::html(str_replace('</head>', $head . '</head>', (string) $html));
    }
}
