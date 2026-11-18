<?php
declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Models\Setting;

/** Textes et coordonnées du site. */
final class SettingController extends Controller
{
    /** GET /api/admin/parametres : valeurs + définitions servant à générer le formulaire */
    public function index(): never
    {
        $this->json(['valeurs' => Setting::all(), 'definitions' => Setting::definitions()]);
    }

    /** PUT /api/admin/parametres : mise à jour partielle */
    public function update(): never
    {
        Setting::save(Setting::validate($this->request->json()));
        $this->json(['valeurs' => Setting::all()]);
    }
}
