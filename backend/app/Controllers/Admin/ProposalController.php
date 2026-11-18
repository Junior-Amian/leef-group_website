<?php
declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Models\Proposal;

/** Consultation des propositions de partenariat reçues. */
final class ProposalController extends Controller
{
    /** GET /api/admin/propositions?page=N */
    public function index(): never
    {
        $this->json(Proposal::paginate((int) $this->request->query('page', '1')));
    }

    /** PATCH /api/admin/propositions/{id} : { "lue": true|false } */
    public function update(int $id): never
    {
        Proposal::find($id);
        $v = $this->validator();
        $read = $v->boolean('lue');
        $v->validate();
        Proposal::setRead($id, $read);
        $this->json(['proposition' => Proposal::find($id)]);
    }

    /** DELETE /api/admin/propositions/{id} */
    public function destroy(int $id): never
    {
        Proposal::find($id);
        Proposal::delete($id);
        $this->noContent();
    }
}
