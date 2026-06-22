<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Rating\StoreOverallRatingRequest;
use App\Http\Resources\OverallRatingResource;
use App\Models\OverallRating;
use App\Support\Reference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * S10 — Overall care rating (mobile "Rate care → Overall" screen). One rating
 * per patient: a repeat submission upserts rather than duplicating. The patient
 * is resolved from the Bearer token.
 */
class RatingController extends Controller
{
    /** POST /ratings/overall — submit or update the overall rating. */
    public function store(StoreOverallRatingRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->patient_serial) {
            return $this->fail('Only patients can submit a rating.', 403);
        }
        $data = $request->validated();

        $existing = OverallRating::where('patient_serial', $user->patient_serial)->first();

        $rating = OverallRating::updateOrCreate(
            ['patient_serial' => $user->patient_serial],
            [
                'rating_no' => $existing->rating_no ?? Reference::code('R', 6),
                'stars' => $data['stars'],
                'comment' => $data['comment'] ?? null,
                'ticket_no' => $data['ticket_no'] ?? ($existing->ticket_no ?? null),
            ]
        );

        return $this->ok(
            new OverallRatingResource($rating->fresh()),
            $existing ? 'Rating updated.' : 'Rating submitted.',
            $existing ? 200 : 201
        );
    }

    /** GET /ratings/overall — the patient's current rating (or null). */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $rating = $user->patient_serial
            ? OverallRating::where('patient_serial', $user->patient_serial)->first()
            : null;

        return $this->ok($rating ? new OverallRatingResource($rating) : null);
    }
}
