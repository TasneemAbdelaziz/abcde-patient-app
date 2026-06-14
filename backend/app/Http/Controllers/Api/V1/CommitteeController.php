<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CommitteeReview;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommitteeController extends Controller
{
    /** POST /visits/{id}/committee — open a committee review (FR4.4.3 / FR13). */
    public function store(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'review_type' => ['required', 'in:funding,direct_admission'],
            'reason' => ['required', 'string'],
            'members' => ['nullable', 'array'],
            'members.*' => ['string'],
        ]);
        Visit::findOrFail($id);

        $review = CommitteeReview::create([
            'ticket_no' => $id,
            'review_type' => $data['review_type'],
            'reason' => $data['reason'],
            'members' => $data['members'] ?? null,
            'decision' => 'pending',
        ]);

        return $this->ok($review, 'Committee review opened.', 201);
    }

    /** POST /committee/{id}/authorize — committee records its decision. */
    public function authorize(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'decision' => ['required', 'in:authorized,declined'],
            'memo' => ['nullable', 'string'],
        ]);
        $review = CommitteeReview::findOrFail($id);
        $review->update([
            'decision' => $data['decision'],
            'memo' => $data['memo'] ?? null,
            'decided_by' => $request->user()->name,
            'decided_at' => now(),
        ]);

        return $this->ok($review, 'Committee decision recorded.');
    }
}
