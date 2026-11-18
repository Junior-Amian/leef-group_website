<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;

/** Enregistrement sécurisé des photos téléversées depuis le panel. */
final class ImageUploader
{
    private const MAX_BYTES = 4 * 1024 * 1024; // 4 Mo
    private const TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

    /** @return string chemin public, ex. /uploads/3f9c….jpg */
    public static function store(?array $file): string
    {
        if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'] ?? '')) {
            $message = in_array($file['error'] ?? null, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
                ? 'La photo dépasse la taille autorisée par le serveur.'
                : 'Aucune photo reçue.';
            throw HttpException::validation(['image' => $message], $message);
        }
        if ($file['size'] > self::MAX_BYTES) {
            throw HttpException::validation(['image' => 'La photo doit peser 4 Mo maximum.']);
        }

        // Type réel lu dans le contenu du fichier : ni le nom ni le type annoncé par le navigateur ne font foi.
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $extension = self::TYPES[$mime] ?? null;
        if ($extension === null || @getimagesize($file['tmp_name']) === false) {
            throw HttpException::validation(['image' => 'Formats acceptés : JPG, PNG ou WebP.']);
        }

        $directory = BASE_PATH . '/public/uploads';
        if (!is_dir($directory) && !mkdir($directory, 0755, true)) {
            throw new \RuntimeException('Dossier uploads impossible à créer.');
        }
        $name = bin2hex(random_bytes(16)) . '.' . $extension; // nom aléatoire : pas de nom fourni par l'utilisateur
        if (!move_uploaded_file($file['tmp_name'], "{$directory}/{$name}")) {
            throw new \RuntimeException('Enregistrement de la photo impossible.');
        }
        return '/uploads/' . $name;
    }
}
