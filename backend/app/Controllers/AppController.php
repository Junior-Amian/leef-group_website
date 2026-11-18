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

        $head = View::render('app-head', ['isAdmin' => $isAdmin, 'content' => $content]);
        $title = $isAdmin ? 'Administration | LEEF GROUP' : ($content['parametres']['seo.titre'] ?? 'LEEF GROUP');
        $html = preg_replace('#<title>.*?</title>#s', '<title>' . View::e($title) . '</title>', $html, 1);
        Response::html(str_replace('</head>', $head . '</head>', (string) $html));
    }
}
