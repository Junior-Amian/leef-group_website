<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Response;
use App\Models\Pole;
use App\Services\Seo;

/** Fichiers destinés aux robots des moteurs de recherche, générés à partir du contenu. */
final class SeoController extends Controller
{
    /** GET /robots.txt : le panel et l'API ne sont pas à explorer ; adresse du plan du site. */
    public function robots(): never
    {
        $lines = ['User-agent: *', 'Disallow: /admin', 'Disallow: /api/'];
        if ($siteUrl = Seo::siteUrl()) {
            $lines[] = '';
            $lines[] = "Sitemap: {$siteUrl}/sitemap.xml";
        }
        Response::text(implode("\n", $lines) . "\n", 'text/plain');
    }

    /** GET /sitemap.xml : l'accueil et la page de chaque pôle actif. */
    public function sitemap(): never
    {
        $siteUrl = Seo::siteUrl();
        if ($siteUrl === null) {
            Response::text("site_url manquant dans la configuration.\n", 'text/plain', 404);
        }
        try {
            $poles = Pole::all(activeOnly: true);
        } catch (\Throwable $e) {
            error_log('Plan du site indisponible : ' . $e->getMessage());
            Response::text("Plan du site momentanément indisponible.\n", 'text/plain', 503); // le robot repassera
        }
        $urls = ["{$siteUrl}/"];
        foreach ($poles as $pole) {
            $urls[] = "{$siteUrl}/poles/{$pole['slug']}";
        }
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
            . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($urls as $url) {
            $xml .= '  <url><loc>' . htmlspecialchars($url, ENT_XML1 | ENT_QUOTES, 'UTF-8') . '</loc></url>' . "\n";
        }
        Response::text($xml . '</urlset>' . "\n", 'application/xml');
    }
}
