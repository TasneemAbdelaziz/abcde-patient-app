<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Quality\RateStageRequest;
use App\Http\Requests\Quality\StoreComplaintRequest;
use App\Http\Requests\Quality\UpdateComplaintRequest;
use App\Http\Resources\ComplaintResource;
use App\Http\Resources\FeedbackRatingResource;
use App\Models\CarePoint;
use App\Models\Complaint;
use App\Models\FeedbackRating;
use App\Models\JourneyTimeline;
use App\Support\Reference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QualityController extends Controller
{
    private const POINTS_PER_RATING = 20;

    /** POST /stages/{id}/feedback — rate a journey stage, earn care points (FR10.1.1). */
    public function rateStage(RateStageRequest $request, int $id): JsonResponse
    {
        $stage = JourneyTimeline::findOrFail($id);
        $visit = $stage->visit;

        if (! $visit) {
            return $this->fail('Not allowed.', 403);
        }
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $visit->patient_serial)) {
            return $deny;
        }

        $data = $request->validated();

        $rating = FeedbackRating::create([
            'ticket_no' => $visit->ticket_no,
            'stage' => $stage->stage,
            'rated_by' => $request->user()->role === 'family' ? 'family' : 'patient',
            'stars' => $data['stars'],
            'comment' => $data['comment'] ?? null,
            'rated_at' => now(),
        ]);

        $points = CarePoint::create([
            'patient_serial' => $visit->patient_serial,
            'points' => self::POINTS_PER_RATING,
            'reason' => "Rated stage: {$stage->stage}",
            'source_type' => 'rating',
            'source_id' => (string) $rating->id,
        ]);

        return $this->ok([
            'rating' => new FeedbackRatingResource($rating),
            'care_points_awarded' => $points->points,
        ], 'Thanks for your feedback.', 201);
    }

    /** POST /complaints — patient reports an issue (FR10.1.2). */
    public function storeComplaint(StoreComplaintRequest $request): JsonResponse
    {
        $data = $request->validated();

        $complaint = Complaint::create([
            'complaint_no' => Reference::code('C', 6),
            'ticket_no' => $data['ticket_no'] ?? null,
            'submitted_at' => now(),
            'stage' => $data['stage'] ?? null,
            'complaint_text' => $data['complaint_text'],
            'routed_to_dept' => $data['routed_to_dept'] ?? null,
            'status' => 'open',
        ]);

        return $this->ok(new ComplaintResource($complaint), 'Complaint submitted.', 201);
    }

    /** GET /complaints — quality team queue (FR10.2.1). */
    public function indexComplaints(Request $request): JsonResponse
    {
        $complaints = Complaint::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('submitted_at')
            ->get();

        return $this->ok(ComplaintResource::collection($complaints));
    }

    /** PATCH /complaints/{id} — quality responds/escalates/closes (FR10.2.1, ≤6h SLA). */
    public function updateComplaint(UpdateComplaintRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $complaint = Complaint::findOrFail($id);
        $complaint->update(array_filter([
            'status' => $data['status'],
            'routed_to_dept' => $data['routed_to_dept'] ?? $complaint->routed_to_dept,
            'responded_at' => in_array($data['status'], ['responded', 'closed'], true) && ! $complaint->responded_at
                ? now()
                : $complaint->responded_at,
        ]));

        return $this->ok(new ComplaintResource($complaint), 'Complaint updated.');
    }

    /** GET /feedback — all ratings for the quality team. */
    public function indexFeedback(Request $request): JsonResponse
    {
        return $this->ok(FeedbackRatingResource::collection(
            FeedbackRating::query()
                ->when($request->filled('stage'), fn ($q) => $q->where('stage', $request->stage))
                ->orderByDesc('rated_at')
                ->get()
        ));
    }

    /** GET /quality/dashboard — satisfaction, SLA, sentiment summary (FR10.2.2). */
    public function dashboard(): JsonResponse
    {
        $ratings = FeedbackRating::all();
        $complaints = Complaint::all();
        $answered = $complaints->filter(fn ($c) => $c->answered_within_sla === true)->count();
        $resolvable = $complaints->filter(fn ($c) => $c->answered_within_sla !== null)->count();

        return $this->ok([
            'avg_satisfaction' => $ratings->isNotEmpty() ? round($ratings->avg('stars'), 2) : null,
            'ratings_count' => $ratings->count(),
            'ratings_by_stage' => $ratings->groupBy('stage')->map(fn ($g) => [
                'count' => $g->count(),
                'avg' => round($g->avg('stars'), 2),
            ]),
            'complaints' => [
                'total' => $complaints->count(),
                'open' => $complaints->where('status', 'open')->count(),
                'answered_within_6h_pct' => $resolvable > 0 ? round($answered / $resolvable * 100) : null,
            ],
            // Naive sentiment proxy until the AI service is wired (NFR-2).
            'sentiment' => [
                'positive' => $ratings->where('stars', '>=', 4)->count(),
                'neutral' => $ratings->where('stars', 3)->count(),
                'negative' => $ratings->where('stars', '<=', 2)->count(),
            ],
        ]);
    }
}
