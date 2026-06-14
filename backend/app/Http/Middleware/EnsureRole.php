<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Role-based access control. Usage: ->middleware('role:doctor,nurse').
 * The "staff" pseudo-role matches any non-patient/non-family role.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Account is disabled.'], 403);
        }

        $allowed = in_array($user->role, $roles, true)
            || (in_array('staff', $roles, true) && $user->isStaff())
            || in_array('any', $roles, true);

        if (! $allowed) {
            return response()->json([
                'message' => 'This action is not allowed for your role.',
                'required_roles' => $roles,
                'your_role' => $user->role,
            ], 403);
        }

        return $next($request);
    }
}
