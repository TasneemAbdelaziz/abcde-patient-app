<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NavController extends Controller
{
    /** GET /nav/map — locations grouped by floor (FR15.1.1). */
    public function map(): JsonResponse
    {
        $byFloor = Location::orderBy('floor')->get()->groupBy('floor');

        return $this->ok($byFloor);
    }

    /** GET /nav/search — find a room/department/clinic (FR15.1.2). */
    public function search(Request $request): JsonResponse
    {
        $request->validate(['q' => ['required', 'string']]);
        $q = $request->q;

        $results = Location::query()
            ->where('location_name', 'like', "%{$q}%")
            ->orWhere('location_code', 'like', "%{$q}%")
            ->orWhere('location_type', 'like', "%{$q}%")
            ->get();

        return $this->ok($results);
    }

    /** GET /nav/route — simple indoor route between two locations (FR15.1.2). */
    public function route(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['required', 'string', 'exists:locations,location_code'],
            'to' => ['required', 'string', 'exists:locations,location_code'],
        ]);

        $from = Location::find($request->from);
        $to = Location::find($request->to);
        $floorChange = (int) $from->floor !== (int) $to->floor;

        $steps = ["Start at {$from->location_name} (floor {$from->floor})"];
        if ($floorChange) {
            $steps[] = "Take the lift to floor {$to->floor}";
        }
        $steps[] = "Proceed to {$to->location_name}";

        return $this->ok([
            'from' => $from,
            'to' => $to,
            'floor_change' => $floorChange,
            'wheelchair_accessible' => $from->wheelchair_accessible && $to->wheelchair_accessible,
            'steps' => $steps,
        ]);
    }
}
