<?php

namespace App\Http\Traits;

use App\Models\Visit;

/**
 * Resolves a {@see Visit} from its ticket number (the route {id} segment),
 * 404-ing when it does not exist. Replaces the repeated
 * `Visit::findOrFail($id)` / `Visit::with(...)->findOrFail($id)` calls.
 */
trait ResolvesVisit
{
    /**
     * @param  array<int,string>  $with  relations to eager-load
     */
    protected function visit(string $ticketNo, array $with = []): Visit
    {
        return Visit::with($with)->findOrFail($ticketNo);
    }
}
