<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Committee\AuthorizeCommitteeRequest;
use App\Http\Requests\Committee\StoreCommitteeReviewRequest;
use App\Http\Resources\CommitteeReviewResource;
use App\Http\Traits\ResolvesVisit;
use App\Models\CommitteeReview;
use Illuminate\Http\JsonResponse;

class CommitteeController extends Controller
{
    use ResolvesVisit;

    /** POST /visits/{id}/committee — open a committee review (FR4.4.3 / FR13). */
    public function store(StoreCommitteeReviewRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $this->visit($id);

        $review = CommitteeReview::create([
            'ticket_no' => $id,
            'review_type' => $data['review_type'],
            'reason' => $data['reason'],
            'members' => $data['members'] ?? null,
            'decision' => 'pending',
        ]);

        return $this->ok(new CommitteeReviewResource($review), 'Committee review opened.', 201);
    }

    /** POST /committee/{id}/authorize — committee records its decision. */
    public function authorize(AuthorizeCommitteeRequest $request, int $id): JsonResponse
    {
        $data = $request->validated();
        $review = CommitteeReview::findOrFail($id);
        $review->update([
            'decision' => $data['decision'],
            'memo' => $data['memo'] ?? null,
            'decided_by' => $request->user()->name,
            'decided_at' => now(),
        ]);

        return $this->ok(new CommitteeReviewResource($review), 'Committee decision recorded.');
    }
}
