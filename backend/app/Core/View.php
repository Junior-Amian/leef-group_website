<?php
declare(strict_types=1);

namespace App\Core;

/** Rendu des gabarits PHP de app/Views (variables extraites, sortie mise en tampon). */
final class View
{
    public static function render(string $template, array $data = []): string
    {
        extract($data, EXTR_SKIP);
        ob_start();
        require BASE_PATH . '/app/Views/' . $template . '.php';
        return (string) ob_get_clean();
    }

    /** Échappement HTML de tout texte inséré dans une vue. */
    public static function e(string $text): string
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}
