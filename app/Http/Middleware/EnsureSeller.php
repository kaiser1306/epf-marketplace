<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSeller
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, ['seller', 'admin'], true)) {
            abort(403, __('Action réservée aux vendeurs.'));
        }

        return $next($request);
    }
}
