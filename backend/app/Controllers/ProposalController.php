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
    private const MAX_PER_HOUR = 5;

    /** POST /api/propositions */
    public function store(): never
    {
        $data = $this->request->json();

        // Piège à robots : champ invisible pour les humains. S'il est rempli, on répond comme si tout allait bien.
        if (trim((string) ($data['siteWeb'] ?? '')) !== '') {
            $this->json(['message' => 'Proposition envoyée.'], 201);
        }

        $proposal = Proposal::validate($data);

        $ip = $this->request->ip();
        if (Proposal::countRecentFromIp($ip, 60) >= self::MAX_PER_HOUR) {
            throw HttpException::tooManyRequests('Vous avez envoyé plusieurs propositions récemment. Réessayez dans une heure ou écrivez-nous sur WhatsApp.');
        }

        Proposal::create($proposal, $ip);
        ProposalNotifier::send($proposal);
        $this->json(['message' => 'Proposition envoyée.'], 201);
    }
}
