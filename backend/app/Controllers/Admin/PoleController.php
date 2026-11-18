<?php
declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Models\Pole;

/** Contenu des six pôles. */
final class PoleController extends Controller
{
    /** GET /api/admin/poles */
    public function index(): never
    {
        $this->json(['poles' => Pole::all(activeOnly: false)]);
    }

    /** GET /api/admin/poles/{id} */
    public function show(int $id): never
    {
        $this->json(['pole' => Pole::find($id)]);
    }

    /** PUT /api/admin/poles/{id} : remplace le contenu du pôle et ses prestations */
    public function update(int $id): never
    {
        Pole::find($id); // 404 si le pôle n'existe pas
        ['pole' => $pole, 'services' => $services] = Pole::validate($this->request->json());
        Pole::update($id, $pole, $services);
        $this->json(['pole' => Pole::find($id)]);
    }
}
