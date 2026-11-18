<?php
declare(strict_types=1);

namespace App\Core;

/** Base des contrôleurs : accès à la requête et raccourcis de réponse. */
abstract class Controller
{
    public function __construct(protected readonly Request $request)
    {
    }

    protected function json(mixed $data, int $status = 200): never
    {
        Response::json($data, $status);
    }

    protected function noContent(): never
    {
        Response::noContent();
    }

    protected function validator(?array $data = null): Validator
    {
        return new Validator($data ?? $this->request->json());
    }
}
