<?php
declare(strict_types=1);

namespace App\Middleware;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Session;

/** Exige une session administrateur ouverte. */
final class Authenticate implements Middleware
{
    public function handle(Request $request): void
    {
        if (!Session::exists()) {
            throw HttpException::unauthorized();
        }
        Session::start($request);
        if (!Session::get('admin')) {
            throw HttpException::unauthorized();
        }
    }
}
