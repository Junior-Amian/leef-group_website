<?php
declare(strict_types=1);

namespace App\Core;

/** Requête HTTP entrante (lecture seule). */
final class Request
{
    private ?array $json = null;

    public function __construct(
        public readonly string $method,
        public readonly string $path,
    ) {
    }

    public static function fromGlobals(): self
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        return new self(strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'), '/' . trim($path, '/'));
    }

    public function isWrite(): bool
    {
        return !in_array($this->method, ['GET', 'HEAD', 'OPTIONS'], true);
    }

    public function query(string $key, string $default = ''): string
    {
        $value = $_GET[$key] ?? $default;
        return is_string($value) ? $value : $default;
    }

    public function header(string $name): string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return (string) ($_SERVER[$key] ?? '');
    }

    /** Corps JSON décodé en tableau associatif (400 s'il est invalide). */
    public function json(): array
    {
        if ($this->json === null) {
            $raw = file_get_contents('php://input') ?: '';
            $decoded = $raw === '' ? [] : json_decode($raw, true);
            if (!is_array($decoded)) {
                throw new HttpException(400, 'json_invalide', 'Le corps de la requête doit être un objet JSON.');
            }
            $this->json = $decoded;
        }
        return $this->json;
    }

    public function file(string $name): ?array
    {
        return isset($_FILES[$name]) && is_array($_FILES[$name]) ? $_FILES[$name] : null;
    }

    public function ip(): string
    {
        return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    }

    public function host(): string
    {
        return (string) ($_SERVER['HTTP_HOST'] ?? '');
    }

    public function isHttps(): bool
    {
        return !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    }
}
