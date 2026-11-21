<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

/**
 * Limitation des tentatives de connexion (table tentatives_connexion), contre la force brute.
 * Deux compteurs : par adresse (Request::rateLimitKey) et par compte (e-mail haché), toutes adresses confondues.
 * La tentative est comptée AVANT la vérification du mot de passe, en une écriture atomique :
 * des requêtes envoyées en rafale ne peuvent pas passer entre la lecture et l'écriture du compteur.
 */
final class LoginAttempt
{
    public const MAX_FAILURES = 5;            // par adresse…
    public const LOCK_MINUTES = 15;           // …sur 15 minutes
    private const MAX_ACCOUNT_FAILURES = 30;  // par compte, sur 60 minutes
    private const ACCOUNT_WINDOW_MINUTES = 60;
    private const COUNTER_CAP = 60000;        // la colonne nombre est un SMALLINT UNSIGNED

    /** Enregistre la tentative ; false si l'une des deux limites est dépassée (la connexion doit être refusée). */
    public static function attempt(string $addressKey, string $email): bool
    {
        if (random_int(1, 100) === 1) {
            self::purge();
        }
        $byAddress = self::hit($addressKey, self::LOCK_MINUTES);
        $byAccount = self::hit(self::accountKey($email), self::ACCOUNT_WINDOW_MINUTES);
        return $byAddress <= self::MAX_FAILURES && $byAccount <= self::MAX_ACCOUNT_FAILURES;
    }

    /** Connexion réussie : remise à zéro des deux compteurs. */
    public static function clear(string $addressKey, string $email): void
    {
        Database::query('DELETE FROM tentatives_connexion WHERE ip IN (?, ?)', [$addressKey, self::accountKey($email)]);
    }

    /** Incrémente le compteur (repart de 1 si le dernier essai date de plus de $minutes) et renvoie sa valeur. */
    private static function hit(string $key, int $minutes): int
    {
        Database::query(
            'INSERT INTO tentatives_connexion (ip, nombre, derniere) VALUES (?, 1, NOW())
             ON DUPLICATE KEY UPDATE
               nombre = IF(derniere > (NOW() - INTERVAL ? MINUTE), LEAST(nombre + 1, ?), 1),
               derniere = NOW()',
            [$key, $minutes, self::COUNTER_CAP]
        );
        return (int) Database::query('SELECT nombre FROM tentatives_connexion WHERE ip = ?', [$key])->fetchColumn();
    }

    /** Clé du compteur par compte (42 caractères au plus, comme la colonne ip) ; l'e-mail n'est pas stocké en clair. */
    private static function accountKey(string $email): string
    {
        return 'compte:' . substr(hash('sha256', mb_strtolower(trim($email))), 0, 32);
    }

    /** Supprime les compteurs expirés (appelé de temps en temps, pour que la table ne grossisse pas). */
    private static function purge(): void
    {
        Database::query('DELETE FROM tentatives_connexion WHERE derniere < (NOW() - INTERVAL 1 DAY)');
    }
}
