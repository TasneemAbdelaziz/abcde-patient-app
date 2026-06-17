<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Visit\AdvanceVisitRequest;
use App\Http\Requests\Visit\CathTypeRequest;
use App\Http\Requests\Visit\StoreCarePlanRequest;
use App\Http\Requests\Visit\StoreVisitRequest;
use App\Http\Requests\Visit\TriageVisitRequest;
use App\Http\Resources\CarePlanResource;
use App\Http\Resources\VisitResource;
use App\Http\Traits\ResolvesVisit;
use App\Models\CarePlan;
use App\Models\JourneyTimeline;
use App\Models\Visit;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VisitController extends Controller
{
    use ResolvesVisit;

    public function __construct(private readonly NotificationService $notifier)
    {
    }

    /** POST /visits — open a ticket/file for a patient (reception, FR4.1.1). */
    public function store(StoreVisitRequest $request): JsonResponse
    {
        $data = $request->validated();

        $ticket = Visit::nextTicketNo();
        $visit = Visit::create([
            'ticket_no' => $ticket,
            'patient_serial' => $data['patient_serial'],
            'arrival_type' => $data['arrival_type'],
            'arrived_at' => now(),
            'dept_code' => $data['dept_code'] ?? null,
            'location_code' => $data['location_code'] ?? null,
            'current_stage' => 'arrival',
            'door_time' => $data['arrival_type'] === 'emergency' ? now() : null,
            'visit_status' => 'open',
        ]);

        $this->recordStage($visit, 'arrival', $request, 'Ticket opened at reception');
        $this->notifier->toPatientAndFamily($visit, 'Visit ticket :ticket created', 'update', null, [], ['ticket' => $ticket]);

        return $this->ok(new VisitResource($visit), 'Visit created.', 201);
    }

    /** GET /visits/{id} — role-filtered visit view. */
    public function show(Request $request, string $id): JsonResponse
    {
        $visit = $this->visit($id, [
            'patient', 'doctor', 'department', 'location', 'timeline',
            'vitals', 'diagnoses', 'prescriptions.drug', 'labResults',
            'radiologyResults', 'carePlan',
        ]);

        if ($deny = $this->denyUnlessPatientAccess($request->user(), $visit->patient_serial)) {
            return $deny;
        }

        return $this->ok(new VisitResource($visit));
    }

    /** GET /visits?filters — staff worklist (stage/dept/status/doctor). */
    public function index(Request $request): JsonResponse
    {
        $visits = Visit::query()
            ->with(['patient', 'doctor', 'department'])
            ->when($request->filled('stage'), fn ($q) => $q->where('current_stage', $request->stage))
            ->when($request->filled('dept_code'), fn ($q) => $q->where('dept_code', $request->dept_code))
            ->when($request->filled('status'), fn ($q) => $q->where('visit_status', $request->status))
            ->when($request->filled('doctor_id'), fn ($q) => $q->where('treating_doctor_id', $request->doctor_id))
            ->orderByDesc('arrived_at')
            ->get();

        return $this->ok(VisitResource::collection($visits));
    }

    /** POST /visits/{id}/triage — nurse classifies and routes (FR4.1.1). */
    public function triage(TriageVisitRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $visit = $this->visit($id);

        $visit->update(array_filter([
            'triage_classification' => $data['triage_classification'],
            'dept_code' => $data['dept_code'] ?? $visit->dept_code,
            'location_code' => $data['location_code'] ?? $visit->location_code,
            'current_stage' => 'triage',
        ]));

        $this->recordStage($visit, 'triage', $request, $data['note'] ?? "Classified {$data['triage_classification']}");
        $this->notifier->toPatientAndFamily($visit, 'You have been triaged', 'update', null, []);

        return $this->ok(new VisitResource($visit->fresh()), 'Triage recorded.');
    }

    /** POST /visits/{id}/advance — move the journey to the next/target stage (FR4.2.1). */
    public function advance(AdvanceVisitRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $visit = $this->visit($id);

        $stage = $data['stage'] ?? $this->nextStage($visit->current_stage);
        if (! $stage) {
            return $this->fail('Visit is already at the final stage.', 422);
        }

        $update = ['current_stage' => $stage];
        if ($data['location_code'] ?? false) {
            $update['location_code'] = $data['location_code'];
        }
        // Capture balloon time when entering the catheterization stage (D2B KPI).
        if ($stage === 'cath') {
            $update['balloon_time'] = $data['balloon_time'] ?? now();
        }
        if ($stage === 'discharge' || $stage === 'followup') {
            $update['visit_status'] = $stage === 'followup' ? 'closed' : $visit->visit_status;
        }
        $visit->update($update);

        $this->recordStage($visit, $stage, $request, $data['note'] ?? null);
        $this->notifier->toPatientAndFamily($visit, 'Your care moved to: :stage', 'stage_change', null, ['stage' => $stage], ['stage' => $stage]);

        return $this->ok(new VisitResource($visit->fresh()), 'Advanced to :stage.', 200, ['stage' => $stage]);
    }

    /** POST /visits/{id}/cath-type — doctor selects catheterization type (FR4.2.3). */
    public function cathType(CathTypeRequest $request, string $id): JsonResponse
    {
        $visit = $this->visit($id);
        $visit->update(['catheterization_type' => $request->validated()['catheterization_type']]);
        $this->recordStage($visit, $visit->current_stage, $request, "Cath type: {$visit->catheterization_type}");

        return $this->ok(new VisitResource($visit->fresh()), 'Catheterization type set.');
    }

    /** GET /visits/{id}/care-plan — latest care plan (FR4.6.1). */
    public function showCarePlan(string $id): JsonResponse
    {
        $visit = $this->visit($id);

        return $this->ok($visit->carePlan ? new CarePlanResource($visit->carePlan) : null);
    }

    /** POST /visits/{id}/care-plan — create/update care plan (doctor, FR4.6.1). */
    public function storeCarePlan(StoreCarePlanRequest $request, string $id): JsonResponse
    {
        $this->visit($id);

        $plan = CarePlan::create(array_merge($request->validated(), [
            'ticket_no' => $id,
            'created_by' => $request->user()->staff_id,
        ]));

        return $this->ok(new CarePlanResource($plan), 'Care plan saved.', 201);
    }

    private function recordStage(Visit $visit, string $stage, Request $request, ?string $note): void
    {
        JourneyTimeline::create([
            'ticket_no' => $visit->ticket_no,
            'stage' => $stage,
            'entered_at' => now(),
            'moved_by_staff_id' => $request->user()->staff_id,
            'decision_note' => $note,
        ]);
    }

    private function nextStage(?string $current): ?string
    {
        $stages = Visit::STAGES;
        $idx = array_search($current, $stages, true);
        if ($idx === false) {
            return $stages[0];
        }

        return $stages[$idx + 1] ?? null;
    }
}
