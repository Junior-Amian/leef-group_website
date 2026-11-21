<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Validation des données entrantes, à la frontière (contrôleurs).
 * Chaque règle renvoie la valeur nettoyée et mémorise l'erreur éventuelle ;
 * validate() lève une seule HttpException 422 qui regroupe toutes les erreurs par champ.
 */
final class Validator
{
    /** @var array<string, string> */
    private array $errors = [];

    public function __construct(private readonly array $data)
    {
    }

    /** Texte ; espaces superflus retirés, retours à la ligne conservés seulement si $multiline. */
    public function string(string $field, int $max, bool $required = true, bool $multiline = false): string
    {
        $value = $this->data[$field] ?? '';
        if (!is_string($value)) {
            return $this->fail($field, 'Ce champ doit être un texte.', '');
        }
        $value = trim(str_replace("\r\n", "\n", $value));
        if (!$multiline) {
            $value = preg_replace('/\s+/u', ' ', $value) ?? '';
        }
        if ($required && $value === '') {
            return $this->fail($field, 'Ce champ est obligatoire.', '');
        }
        if (mb_strlen($value) > $max) {
            return $this->fail($field, "{$max} caractères maximum.", $value);
        }
        return $value;
    }

    public function email(string $field, bool $required = true): string
    {
        $value = $this->string($field, 190, $required);
        // FILTER_VALIDATE_EMAIL accepte « ? & = % / # » (valides selon la RFC, mais jamais vus dans une vraie adresse) :
        // refusés, car ils permettent d'injecter des paramètres dans un lien mailto: (« a?bcc=x@y.ci »).
        if ($value !== '' && (filter_var($value, FILTER_VALIDATE_EMAIL) === false || preg_match('#[?&=%/\\\\\#]#', $value))) {
            return $this->fail($field, 'Saisissez une adresse e-mail valide, par exemple nom@entreprise.ci.', $value);
        }
        return mb_strtolower($value);
    }

    public function url(string $field, bool $required = false): string
    {
        $value = $this->string($field, 500, $required);
        if ($value !== '' && !preg_match('#^https://[^\s<>"]+$#i', $value)) {
            return $this->fail($field, 'Saisissez une adresse complète commençant par https://.', $value);
        }
        return $value;
    }

    public function phone(string $field): string
    {
        $value = $this->string($field, 30);
        if ($value !== '' && !preg_match('/^\+?[\d\s().-]{8,}$/', $value)) {
            return $this->fail($field, 'Saisissez un numéro valide avec l’indicatif, par exemple +225 07 00 00 00 00.', $value);
        }
        return $value;
    }

    public function decimal(string $field, float $min, float $max): string
    {
        $value = str_replace(',', '.', $this->string($field, 20));
        if ($value !== '' && (!is_numeric($value) || (float) $value < $min || (float) $value > $max)) {
            return $this->fail($field, "Saisissez un nombre entre {$min} et {$max}.", $value);
        }
        return $value;
    }

    /** @param list<string> $allowed liste blanche des valeurs acceptées */
    public function in(string $field, array $allowed): string
    {
        $value = $this->data[$field] ?? '';
        if (!is_string($value) || !in_array($value, $allowed, true)) {
            return $this->fail($field, 'Choisissez une valeur dans la liste.', '');
        }
        return $value;
    }

    public function boolean(string $field): bool
    {
        $value = $this->data[$field] ?? null;
        if (!is_bool($value)) {
            $this->addError($field, 'Valeur oui/non attendue.');
            return false;
        }
        return $value;
    }

    public function addError(string $field, string $message): void
    {
        $this->errors[$field] ??= $message;
    }

    /** @return array<string, string> */
    public function errors(): array
    {
        return $this->errors;
    }

    public function validate(): void
    {
        if ($this->errors !== []) {
            throw HttpException::validation($this->errors);
        }
    }

    private function fail(string $field, string $message, mixed $value): mixed
    {
        $this->addError($field, $message);
        return $value;
    }
}
