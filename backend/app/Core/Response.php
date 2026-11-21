<?php
declare(strict_types=1);

namespace App\Core;

/** Écriture des réponses HTTP (JSON pour l'API, HTML pour la page de l'application). */
final class Response
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'"); // une réponse JSON ne charge rien
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        exit;
    }

    public static function noContent(): never
    {
        http_response_code(204);
        exit;
    }

    public static function error(HttpException $e): never
    {
        $error = ['code' => $e->errorCode, 'message' => $e->getMessage()];
        if ($e->fields !== []) {
            $error['champs'] = $e->fields;
        }
        self::json(['erreur' => $error], $e->status);
    }

    public static function html(string $html, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: text/html; charset=utf-8');
        echo $html;
        exit;
    }

    /** En-têtes de sécurité envoyés sur toutes les réponses. */
    public static function securityHeaders(): void
    {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
        if (Config::get('https', false)) {
            // Le navigateur refusera ensuite toute connexion non chiffrée au site pendant un an.
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
        header_remove('X-Powered-By');
    }
}
