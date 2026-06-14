<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves a Sanctum user when a valid bearer token is present, but does NOT
 * reject the request when it is absent. Used by endpoints that serve both
 * guests and authenticated users (e.g. requesting an appointment).
 */
class OptionalSanctum
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken()) {
            $user = auth('sanctum')->user();
            if ($user) {
                $request->setUserResolver(fn () => $user);
            }
        }

        return $next($request);
    }
}
