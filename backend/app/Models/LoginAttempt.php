<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

/** Échecs de connexion par adresse IP (table tentatives_connexion), pour bloquer les attaques par force brute. */
final class LoginAttempt
{
    public const MAX_FAILURES = 5;
    public const LOCK_MINUTES = 15;

    public static function isLocked(string $ip): bool
    {
        $count = Database::query(
            'SELECT nombre FROM tentatives_connexion WHERE ip = ? AND derniere > (NOW() - INTERVAL ? MINUTE)',
            [$ip, self::LOCK_MINUTES]
        )->fetchColumn();
        return $count !== false && (int) $count >= self::MAX_FAILURES;
    }

    /** Le compteur repart de 1 si le dernier échec date de plus de LOCK_MINUTES. */
    public static function recordFailure(string $ip): void
    {
        Database::query(
            'INSERT INTO tentatives_connexion (ip, nombre, derniere) VALUES (?, 1, NOW())
             ON DUPLICATE KEY UPDATE
               nombre = IF(derniere > (NOW() - INTERVAL ? MINUTE), nombre + 1, 1),
               derniere = NOW()',
            [$ip, self::LOCK_MINUTES]
        );
    }

    public static function clear(string $ip): void
    {
        Database::query('DELETE FROM tentatives_connexion WHERE ip = ?', [$ip]);
    }
}
