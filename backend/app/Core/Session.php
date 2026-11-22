<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Session du panel d'administration, durcie :
 * cookie httpOnly + SameSite=Strict (+ Secure en HTTPS), mode strict, expiration après inactivité,
 * nouvel identifiant à la connexion, jeton CSRF par session.
 */
final class Session
{
    private const NAME = 'LEEFADMIN';
    private const IDLE_TIMEOUT = 7200;   // 2 heures sans activité
    private const MAX_LIFETIME = 43200;  // 12 heures au total, même en activité continue

    public static function exists(): bool
    {
        return isset($_COOKIE[self::NAME]);
    }

    public static function start(Request $request): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        ini_set('session.use_strict_mode', '1');   // refuse les identifiants inventés par le client
        ini_set('session.use_only_cookies', '1');
        session_name(self::NAME);
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            // Config « https » : derrière un proxy, PHP peut ne pas voir le HTTPS ; le cookie reste Secure.
            'secure'   => $request->isHttps() || Config::get('https', false),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        session_start();

        $now = time();
        $lastActivity = $_SESSION['_last_activity'] ?? null;
        $createdAt = $_SESSION['_created'] ?? null;
        if (($lastActivity !== null && $now - $lastActivity > self::IDLE_TIMEOUT)
            || ($createdAt !== null && $now - $createdAt > self::MAX_LIFETIME)) {
            self::destroy();
            session_start();
        }
        $_SESSION['_created'] ??= $now;
        $_SESSION['_last_activity'] = $now;
    }

    public static function get(string $key): mixed
    {
        return $_SESSION[$key] ?? null;
    }

    public static function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }

    /** Nouvel identifiant de session et nouveau jeton CSRF (à appeler à la connexion). */
    public static function regenerate(): void
    {
        session_regenerate_id(true);
        $_SESSION['_csrf'] = bin2hex(random_bytes(32));
        $_SESSION['_created'] = time(); // la durée maximale court à partir de la connexion
    }

    public static function csrfToken(): string
    {
        return $_SESSION['_csrf'] ??= bin2hex(random_bytes(32));
    }

    public static function destroy(): void
    {
        $_SESSION = [];
        setcookie(self::NAME, '', [
            'expires' => time() - 3600, 'path' => '/', 'secure' => (bool) Config::get('https', false),
            'httponly' => true, 'samesite' => 'Strict',
        ]);
        session_destroy();
    }
}
