<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Constants\Role; // Import della classe Role per usare le costanti

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            abort(401, 'Accesso negato: autenticazione richiesta.');
        }

        if (auth()->user()->role !== Role::ADMIN) {
            abort(403, 'Accesso negato: permesso negato.');
        }

        return $next($request);
    }
}
