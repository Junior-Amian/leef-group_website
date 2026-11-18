<?php
declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Services\ImageUploader;

/** Téléversement des photos. */
final class ImageController extends Controller
{
    /** POST /api/admin/images (multipart/form-data, champ « image ») */
    public function store(): never
    {
        $this->json(['url' => ImageUploader::store($this->request->file('image'))], 201);
    }
}
