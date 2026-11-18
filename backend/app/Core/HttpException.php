<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Erreur attendue, renvoyée au client au format du contrat de l'API :
 * { "erreur": { "code": "...", "message": "...", "champs": { "email": "..." } } }
 */
final class HttpException extends \RuntimeException
{
    /** @param array<string, string> $fields erreurs par champ (validation) */
    public function __construct(
        public readonly int $status,
        public readonly string $errorCode,
        string $message,
        public readonly array $fields = [],
    ) {
        parent::__construct($message);
    }

    public static function notFound(string $message = 'Ressource introuvable.'): self
    {
        return new self(404, 'introuvable', $message);
    }

    public static function unauthorized(string $message = 'Connectez-vous pour accéder au panel.'): self
    {
        return new self(401, 'non_authentifie', $message);
    }

    public static function forbidden(string $message = 'Requête refusée.'): self
    {
        return new self(403, 'interdit', $message);
    }

    /** @param array<string, string> $fields */
    public static function validation(array $fields, string $message = 'Certains champs sont à corriger.'): self
    {
        return new self(422, 'validation', $message, $fields);
    }

    public static function tooManyRequests(string $message): self
    {
        return new self(429, 'trop_de_requetes', $message);
    }
}
