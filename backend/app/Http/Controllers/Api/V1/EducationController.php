<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CarePointResource;
use App\Models\CarePoint;
use App\Models\EducationContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EducationController extends Controller
{
    /** GET /education/videos — educational content by condition/stage (FR14.1.1). */
    public function videos(Request $request): JsonResponse
    {
        $content = EducationContent::query()
            ->whereIn('content_type', ['video', 'article'])
            ->when($request->filled('condition'), fn ($q) => $q->where('condition', $request->condition))
            ->when($request->filled('stage'), fn ($q) => $q->whereIn('journey_stage', [$request->stage, 'any']))
            ->orderBy('journey_stage')
            ->get();

        return $this->ok($content);
    }

    /** GET /education/relax — calming/relaxation content (FR14.1.2). */
    public function relax(): JsonResponse
    {
        $content = EducationContent::where('content_type', 'audio')
            ->orWhere('journey_stage', 'any')
            ->get();

        // Always include a small built-in relaxation set for the demo.
        $builtIn = [
            ['title' => 'Calm Breathing', 'content_type' => 'audio', 'duration_min' => 5],
            ['title' => 'Nature Sounds', 'content_type' => 'audio', 'duration_min' => 10],
            ['title' => 'Light Puzzle Game', 'content_type' => 'game', 'duration_min' => null],
        ];

        return $this->ok(['library' => $content, 'relax_kit' => $builtIn]);
    }

    /** GET /patients/{serial}/care-points — loyalty balance + ledger (FR14.2.1). */
    public function carePoints(Request $request, string $serial): JsonResponse
    {
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $serial)) {
            return $deny;
        }

        $ledger = CarePoint::where('patient_serial', $serial)->latest()->get();

        return $this->ok([
            'patient_serial' => $serial,
            'total' => (int) $ledger->sum('points'),
            'ledger' => CarePointResource::collection($ledger),
        ]);
    }
}
