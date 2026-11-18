<?php
declare(strict_types=1);

namespace App\Core;

/** Accès en lecture seule à la configuration (config/config.php). */
final class Config
{
    private static array $values = [];

    public static function load(array $values): void
    {
        self::$values = $values;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return self::$values[$key] ?? $default;
    }
}
