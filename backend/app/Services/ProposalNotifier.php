<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Config;
use App\Models\Setting;

/**
 * Prévient LEEF GROUP par e-mail d'une nouvelle proposition de partenariat.
 * Un échec d'envoi ne bloque pas le dépôt : la proposition reste consultable dans le panel.
 */
final class ProposalNotifier
{
    public static function send(array $proposal): void
    {
        $to = Setting::get('contact.email_notifications');
        if ($to === '') {
            return;
        }
        // Les valeurs viennent du formulaire : on retire tout retour à la ligne des en-têtes (injection d'en-têtes).
        $replyTo = str_replace(["\r", "\n"], '', $proposal['email']);
        $subject = '=?UTF-8?B?' . base64_encode('Partenariat : ' . $proposal['organisation']) . '?=';
        $body = "Nouvelle proposition de partenariat reçue sur le site.\n\n"
            . "Profil : {$proposal['profil']}\n"
            . "Organisation : {$proposal['organisation']}\n"
            . "Nom : {$proposal['nom']}\n"
            . "E-mail : {$proposal['email']}\n"
            . "Pôle concerné : {$proposal['pole']}\n\n"
            . $proposal['message'] . "\n";
        $headers = [
            'From'         => Config::get('mail_from', 'no-reply@localhost'),
            'Reply-To'     => $replyTo,
            'Content-Type' => 'text/plain; charset=utf-8',
        ];
        if (!@mail($to, $subject, $body, $headers)) {
            error_log('Notification de partenariat non envoyée.');
        }
    }
}
