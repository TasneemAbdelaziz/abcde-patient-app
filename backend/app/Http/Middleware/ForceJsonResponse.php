<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * This is a JSON API. Force every request through it to be treated as JSON so
 * that auth/validation/not-found failures render as JSON envelopes (401/422/404)
 * instead of attempting a web redirect to a non-existent `login` route (which
 * would surface as a 500 for clients that omit the Accept header).
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
