<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\HttpException;
use App\Models\Proposal;
use App\Services\ProposalNotifier;

/** Dépôt d'une proposition de partenariat depuis le site public. */
final class ProposalController extends Controller
{
    private const MAX_PER_HOUR = 5;                 // par adresse
    private const MAX_NOTIFICATIONS_PER_HOUR = 20;  // pour tout le site : au-delà, rafale de spam probable

    /** POST /api/propositions */
    public function store(): never
    {
        $data = $this->request->json();

        // Piège à robots : champ invisible pour les humains. S'il est rempli, on répond comme si tout allait bien.
        if (trim((string) ($data['siteWeb'] ?? '')) !== '') {
            $this->json(['message' => 'Proposition envoyée.'], 201);
        }

        $proposal = Proposal::validate($data);

        // Adresse IPv6 réduite à son préfixe /64 (voir Request::rateLimitKey) : c'est aussi ce qui est enregistré.
        $addressKey = $this->request->rateLimitKey();
        if (Proposal::countRecentFromIp($addressKey, 60) >= self::MAX_PER_HOUR) {
            throw HttpException::tooManyRequests('Vous avez envoyé plusieurs propositions récemment. Réessayez dans une heure ou écrivez-nous sur WhatsApp.');
        }

        Proposal::create($proposal, $addressKey);
        // Toujours enregistrée et visible dans le panel ; seul l'e-mail est suspendu en cas de rafale.
        if (Proposal::countRecent(60) <= self::MAX_NOTIFICATIONS_PER_HOUR) {
            ProposalNotifier::send($proposal);
        } else {
            error_log('Notification de partenariat suspendue : plus de ' . self::MAX_NOTIFICATIONS_PER_HOUR . ' propositions en une heure.');
        }
        $this->json(['message' => 'Proposition envoyée.'], 201);
    }
}
