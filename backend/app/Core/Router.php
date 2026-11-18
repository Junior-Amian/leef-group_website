<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Routeur : associe méthode + motif d'URL à une action de contrôleur, précédée de middlewares.
 * Paramètre de chemin pris en charge : {id} (entier).
 */
final class Router
{
    /** @var list<array{method: string, regex: string, action: array{class-string, string}, middleware: list<class-string>}> */
    private array $routes = [];
    private string $prefix = '';
    /** @var list<class-string> */
    private array $middleware = [];

    /** Groupe de routes partageant un préfixe et des middlewares. */
    public function group(string $prefix, array $middleware, callable $define): void
    {
        [$previousPrefix, $previousMiddleware] = [$this->prefix, $this->middleware];
        $this->prefix .= $prefix;
        $this->middleware = [...$this->middleware, ...$middleware];
        $define($this);
        [$this->prefix, $this->middleware] = [$previousPrefix, $previousMiddleware];
    }

    public function get(string $path, array $action): void    { $this->add('GET', $path, $action); }
    public function post(string $path, array $action): void   { $this->add('POST', $path, $action); }
    public function put(string $path, array $action): void    { $this->add('PUT', $path, $action); }
    public function patch(string $path, array $action): void  { $this->add('PATCH', $path, $action); }
    public function delete(string $path, array $action): void { $this->add('DELETE', $path, $action); }

    public function dispatch(Request $request): void
    {
        $pathKnown = false;
        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $request->path, $matches)) {
                continue;
            }
            $pathKnown = true;
            if ($route['method'] !== $request->method) {
                continue;
            }
            foreach ($route['middleware'] as $middleware) {
                (new $middleware())->handle($request);
            }
            [$class, $method] = $route['action'];
            (new $class($request))->$method(...array_map('intval', array_slice($matches, 1)));
            return;
        }
        throw $pathKnown
            ? new HttpException(405, 'methode_non_autorisee', 'Méthode non autorisée pour cette ressource.')
            : HttpException::notFound('Route inconnue.');
    }

    private function add(string $method, string $path, array $action): void
    {
        $pattern = str_replace(preg_quote('{id}', '#'), '(\d+)', preg_quote($this->prefix . $path, '#'));
        $this->routes[] = [
            'method'     => $method,
            'regex'      => '#^' . $pattern . '$#',
            'action'     => $action,
            'middleware' => $this->middleware,
        ];
    }
}
