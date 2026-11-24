<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

/**
 * Mesure d'audience du site public (tables visites et sels_visites), anonyme et sans cookie :
 * - aucune adresse IP ni navigateur n'est enregistré ; le visiteur n'est qu'une empreinte
 *   (adresse + navigateur hachés avec un sel du jour). Le sel est supprimé le lendemain :
 *   les empreintes passées ne peuvent plus être recalculées ni reliées d'un jour à l'autre ;
 * - seule la date est conservée (pas l'heure), avec la page, le site d'origine et le type d'appareil ;
 * - les données sont supprimées après 13 mois.
 * Un « visiteur » est donc compté une fois par jour : sur une période, c'est la somme des visiteurs de chaque jour.
 */
final class Visit
{
    public const DEVICES = ['mobile', 'tablette', 'ordinateur'];
    private const RETENTION_DAYS = 395;            // 13 mois
    private const MAX_PAGE_VIEWS_PER_DAY = 300;    // par visiteur : au-delà, gonflage volontaire probable
    private const BOT_PATTERN = '/bot|crawl|spider|slurp|archiver|preview|headless|lighthouse|pagespeed|facebookexternalhit|whatsapp|curl|wget|python|java\/|okhttp|axios|go-http|httpclient|monitor/i';

    /** Le navigateur est-il un robot (moteur, aperçu de lien, outil) ? Ces passages ne sont pas comptés. */
    public static function isBot(string $userAgent): bool
    {
        return $userAgent === '' || preg_match(self::BOT_PATTERN, $userAgent) === 1;
    }

    /**
     * Enregistre une page vue.
     * @param bool $entry première page affichée lors de l'arrivée sur le site (porte la provenance)
     */
    public static function record(string $path, bool $entry, string $source, string $userAgent, string $addressKey): void
    {
        $today = date('Y-m-d');
        if (random_int(1, 200) === 1) {
            self::purge($today);
        }
        $visitor = substr(hash_hmac('sha256', $addressKey . '|' . $userAgent, self::dailySalt($today)), 0, 16);

        $viewsToday = (int) Database::query(
            'SELECT COUNT(*) FROM visites WHERE jour = ? AND visiteur = ?',
            [$today, $visitor]
        )->fetchColumn();
        if ($viewsToday >= self::MAX_PAGE_VIEWS_PER_DAY) {
            return;
        }

        Database::query(
            'INSERT INTO visites (jour, chemin, entree, source, appareil, visiteur) VALUES (?, ?, ?, ?, ?, ?)',
            [$today, $path, $entry ? 1 : 0, $entry ? $source : '', self::device($userAgent), $visitor]
        );
    }

    /** Totaux d'une période (dates incluses, AAAA-MM-JJ). @return array{pagesVues: int, visiteurs: int, visites: int} */
    public static function totals(string $from, string $to): array
    {
        $row = Database::query(
            'SELECT COUNT(*) AS pages_vues, COUNT(DISTINCT jour, visiteur) AS visiteurs, COALESCE(SUM(entree), 0) AS visites
             FROM visites WHERE jour BETWEEN ? AND ?',
            [$from, $to]
        )->fetch();
        return ['pagesVues' => (int) $row['pages_vues'], 'visiteurs' => (int) $row['visiteurs'], 'visites' => (int) $row['visites']];
    }

    /** @return array<string, array{pagesVues: int, visiteurs: int}> indexé par jour (jours sans visite absents) */
    public static function byDay(string $from, string $to): array
    {
        $rows = Database::query(
            'SELECT jour, COUNT(*) AS pages_vues, COUNT(DISTINCT visiteur) AS visiteurs
             FROM visites WHERE jour BETWEEN ? AND ? GROUP BY jour',
            [$from, $to]
        )->fetchAll();
        $days = [];
        foreach ($rows as $row) {
            $days[$row['jour']] = ['pagesVues' => (int) $row['pages_vues'], 'visiteurs' => (int) $row['visiteurs']];
        }
        return $days;
    }

    /** Pages les plus vues. @return list<array{chemin: string, pagesVues: int, visiteurs: int}> */
    public static function topPages(string $from, string $to, int $limit = 10): array
    {
        $rows = Database::query(
            'SELECT chemin, COUNT(*) AS pages_vues, COUNT(DISTINCT jour, visiteur) AS visiteurs
             FROM visites WHERE jour BETWEEN ? AND ? GROUP BY chemin ORDER BY pages_vues DESC, chemin LIMIT ?',
            [$from, $to, $limit]
        )->fetchAll();
        return array_map(static fn (array $r) => [
            'chemin' => $r['chemin'], 'pagesVues' => (int) $r['pages_vues'], 'visiteurs' => (int) $r['visiteurs'],
        ], $rows);
    }

    /** Provenance des arrivées sur le site ('' = accès direct). @return list<array{source: string, visites: int}> */
    public static function topSources(string $from, string $to, int $limit = 8): array
    {
        $rows = Database::query(
            'SELECT source, COUNT(*) AS visites FROM visites WHERE jour BETWEEN ? AND ? AND entree = 1
             GROUP BY source ORDER BY visites DESC, source LIMIT ?',
            [$from, $to, $limit]
        )->fetchAll();
        return array_map(static fn (array $r) => ['source' => $r['source'], 'visites' => (int) $r['visites']], $rows);
    }

    /** Visiteurs par type d'appareil. @return array<string, int> mobile, tablette, ordinateur */
    public static function byDevice(string $from, string $to): array
    {
        $counts = array_fill_keys(self::DEVICES, 0);
        $rows = Database::query(
            'SELECT appareil, COUNT(DISTINCT jour, visiteur) AS visiteurs FROM visites WHERE jour BETWEEN ? AND ? GROUP BY appareil',
            [$from, $to]
        )->fetchAll();
        foreach ($rows as $row) {
            $counts[$row['appareil']] = (int) $row['visiteurs'];
        }
        return $counts;
    }

    /** Type d'appareil déduit du navigateur (approximation suffisante pour une tendance). */
    private static function device(string $userAgent): string
    {
        if (preg_match('/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i', $userAgent)) {
            return 'tablette';
        }
        return preg_match('/Mobi|iPhone|iPod|Android|Opera Mini|IEMobile/i', $userAgent) ? 'mobile' : 'ordinateur';
    }

    /** Sel aléatoire du jour, créé à la première visite du jour. */
    private static function dailySalt(string $today): string
    {
        $salt = Database::query('SELECT sel FROM sels_visites WHERE jour = ?', [$today])->fetchColumn();
        if (is_string($salt)) {
            return $salt;
        }
        // INSERT IGNORE : si deux visites créent le sel en même temps, la première gagne et les deux relisent la même valeur.
        Database::query('INSERT IGNORE INTO sels_visites (jour, sel) VALUES (?, ?)', [$today, bin2hex(random_bytes(32))]);
        Database::query('DELETE FROM sels_visites WHERE jour < ?', [$today]);
        return (string) Database::query('SELECT sel FROM sels_visites WHERE jour = ?', [$today])->fetchColumn();
    }

    /** Supprime les visites de plus de 13 mois (appelé de temps en temps). */
    private static function purge(string $today): void
    {
        $limit = date('Y-m-d', (int) strtotime("{$today} -" . self::RETENTION_DAYS . ' days'));
        Database::query('DELETE FROM visites WHERE jour < ?', [$limit]);
    }
}
