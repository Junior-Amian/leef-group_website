<?php
declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Database;
use App\Models\Proposal;
use App\Models\Visit;

/** Tableau de bord du panel : fréquentation du site et propositions reçues sur une période. */
final class StatisticsController extends Controller
{
    private const PERIODS = [7, 30, 90]; // jours, aujourd'hui compris
    private const DEFAULT_PERIOD = 30;

    /** GET /api/admin/statistiques?periode=7|30|90 */
    public function index(): never
    {
        $days = (int) $this->request->query('periode', (string) self::DEFAULT_PERIOD);
        if (!in_array($days, self::PERIODS, true)) {
            $days = self::DEFAULT_PERIOD;
        }
        $to = date('Y-m-d');
        $from = self::shift($to, -($days - 1));
        // Période précédente de même durée, pour l'évolution de chaque indicateur.
        [$previousFrom, $previousTo] = [self::shift($from, -$days), self::shift($from, -1)];

        $this->json([
            'periode'   => $days,
            'debut'     => $from,
            'fin'       => $to,
            'totaux'    => self::totals($from, $to),
            'precedent' => self::totals($previousFrom, $previousTo),
            'parJour'   => self::byDay($from, $to),
            'pages'     => self::pages($from, $to),
            'sources'   => Visit::topSources($from, $to),
            'appareils' => Visit::byDevice($from, $to),
            'propositionsParProfil' => Proposal::countByProfile($from, $to),
            'propositionsParPole'   => Proposal::countByPole($from, $to),
            'nonLues'   => Proposal::countUnread(),
        ]);
    }

    /** @return array{pagesVues: int, visiteurs: int, visites: int, propositions: int} */
    private static function totals(string $from, string $to): array
    {
        return Visit::totals($from, $to) + ['propositions' => Proposal::countBetween($from, $to)];
    }

    /** Une entrée par jour de la période, y compris les jours sans visite (à zéro). */
    private static function byDay(string $from, string $to): array
    {
        $visits = Visit::byDay($from, $to);
        $proposals = Proposal::countByDay($from, $to);
        $series = [];
        for ($day = $from; $day <= $to; $day = self::shift($day, 1)) {
            $series[] = [
                'jour'         => $day,
                'pagesVues'    => $visits[$day]['pagesVues'] ?? 0,
                'visiteurs'    => $visits[$day]['visiteurs'] ?? 0,
                'propositions' => $proposals[$day] ?? 0,
            ];
        }
        return $series;
    }

    /** Pages les plus vues, avec leur nom lisible (« Accueil », nom du pôle). */
    private static function pages(string $from, string $to): array
    {
        $names = [];
        foreach (Database::query('SELECT slug, nom FROM poles')->fetchAll() as $pole) {
            $names['/poles/' . $pole['slug']] = $pole['nom'];
        }
        return array_map(
            static fn (array $page) => $page + ['libelle' => $page['chemin'] === '/' ? 'Accueil' : ($names[$page['chemin']] ?? $page['chemin'])],
            Visit::topPages($from, $to)
        );
    }

    private static function shift(string $day, int $days): string
    {
        return date('Y-m-d', (int) strtotime("{$day} {$days} days"));
    }
}
