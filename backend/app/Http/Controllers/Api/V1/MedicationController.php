<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Medication\AdministerRequest;
use App\Http\Requests\Medication\ReconciliationRequest;
use App\Http\Requests\Medication\StorePrescriptionRequest;
use App\Http\Resources\DrugResource;
use App\Http\Resources\MarAdministrationResource;
use App\Http\Resources\PrescriptionResource;
use App\Http\Traits\ResolvesVisit;
use App\Models\Drug;
use App\Models\MarAdministration;
use App\Models\Prescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicationController extends Controller
{
    use ResolvesVisit;

    /** POST /visits/{id}/prescriptions — doctor prescribes (FR6.1.1). */
    public function store(StorePrescriptionRequest $request, string $id): JsonResponse
    {
        $this->visit($id);

        $rx = Prescription::create(array_merge($request->validated(), [
            'ticket_no' => $id,
            'prescribed_at' => now(),
            'doctor_id' => $request->user()->staff_id,
        ]));

        return $this->ok(new PrescriptionResource($rx->load('drug')), 'Prescription created.', 201);
    }

    /** GET /visits/{id}/prescriptions — list with pharmacy availability. */
    public function index(Request $request, string $id): JsonResponse
    {
        $visit = $this->visit($id);
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $visit->patient_serial)) {
            return $deny;
        }

        $rxs = $visit->prescriptions()->with('drug')->orderByDesc('prescribed_at')->get();

        return $this->ok(PrescriptionResource::collection($rxs));
    }

    /** POST /prescriptions/{id}/administer — MAR entry (nurse) or self-confirm (patient). */
    public function administer(AdministerRequest $request, int $id): JsonResponse
    {
        $rx = Prescription::findOrFail($id);
        $user = $request->user();

        $isPatient = ! $user->isStaff();
        if ($isPatient && ! $this->canAccessPatient($user, $rx->visit?->patient_serial)) {
            return $this->fail('Not allowed.', 403);
        }

        $data = $request->validated();

        $mar = MarAdministration::create([
            'ticket_no' => $rx->ticket_no,
            'prescription_id' => $rx->id,
            'drug_name' => $rx->drug_name,
            'scheduled_time' => $data['scheduled_time'] ?? now(),
            'actual_time' => $data['actual_time'] ?? now(),
            'administered_by' => $isPatient ? 'PATIENT' : $user->staff_id,
            'action' => $data['action'],
            'note' => $data['note'] ?? ($isPatient ? 'Self-confirmed in the patient app' : null),
        ]);

        return $this->ok(new MarAdministrationResource($mar), 'Administration logged.', 201);
    }

    /** POST /visits/{id}/reconciliation — medication reconciliation (FR6.1.2). */
    public function reconciliation(ReconciliationRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $visit = $this->visit($id);

        $current = $visit->prescriptions()->pluck('drug_name')->unique()->values();
        $home = collect($data['home_medications'] ?? []);

        return $this->ok([
            'ticket_no' => $id,
            'current_inpatient' => $current,
            'home_medications' => $home,
            'to_continue' => $home->intersect($current)->values(),
            'newly_started' => $current->diff($home)->values(),
            'to_review' => $home->diff($current)->values(),
            'note' => $data['note'] ?? null,
        ], 'Medications reconciled.');
    }

    /** GET /pharmacy/availability — drug stock lookup. */
    public function pharmacyAvailability(Request $request): JsonResponse
    {
        $drugs = Drug::query()
            ->when($request->filled('drug'), fn ($q) => $q->where('drug_name', 'like', "%{$request->drug}%"))
            ->when($request->boolean('cardiac_only'), fn ($q) => $q->where('part_of_cardiac_protocol', true))
            ->orderBy('drug_name')
            ->get();

        return $this->ok(DrugResource::collection($drugs));
    }
}
