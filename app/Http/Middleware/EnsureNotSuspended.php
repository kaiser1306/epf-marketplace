<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotSuspended
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->suspended_at !== null) {
            abort(403, __('Compte suspendu. Contactez le support.'));
        }

        return $next($request);
    }
}
