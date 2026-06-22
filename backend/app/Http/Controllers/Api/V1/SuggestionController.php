<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Suggestion\StoreSuggestionRequest;
use App\Http\Resources\SuggestionResource;
use App\Models\Suggestion;
use App\Support\Reference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * S10 — Patient improvement suggestions (mobile "Development" screen).
 * The patient is resolved from the Bearer token; patient_serial is never
 * trusted from the request body. Staff (quality/director/admin) may list all.
 */
class SuggestionController extends Controller
{
    /** POST /suggestions — submit a suggestion. */
    public function store(StoreSuggestionRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->patient_serial) {
            return $this->fail('Only patients can submit suggestions.', 403);
        }
        $data = $request->validated();

        $suggestion = Suggestion::create([
            'suggestion_no' => Reference::code('S', 6),
            'patient_serial' => $user->patient_serial,
            'area' => $data['area'],
            'suggestion_text' => $data['suggestion_text'],
            'ticket_no' => $data['ticket_no'] ?? null,
            'status' => 'open',
            'submitted_at' => now(),
        ]);

        return $this->ok(new SuggestionResource($suggestion), 'Suggestion submitted.', 201);
    }

    /** GET /suggestions — the patient's own list (or all, for the quality team). */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Suggestion::query()->orderByDesc('submitted_at')
            ->when($request->filled('area'), fn ($q) => $q->where('area', $request->area))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status));

        // patients/family see only their own; staff see everything
        if (! $user->isStaff()) {
            $query->where('patient_serial', $user->patient_serial);
        }

        return $this->ok(SuggestionResource::collection($query->get()));
    }
}
