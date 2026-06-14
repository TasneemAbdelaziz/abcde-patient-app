<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Drug;
use App\Models\MarAdministration;
use App\Models\Prescription;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicationController extends Controller
{
    /** POST /visits/{id}/prescriptions — doctor prescribes (FR6.1.1). */
    public function store(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'drug_name' => ['required', 'string'],
            'dose' => ['nullable', 'string'],
            'route' => ['nullable', 'in:PO,IV,SC,IM'],
            'frequency' => ['nullable', 'string'],
            'duration_days' => ['nullable', 'integer', 'min:1'],
            'patient_instructions' => ['nullable', 'string'],
        ]);
        Visit::findOrFail($id);

        $rx = Prescription::create(array_merge($data, [
            'ticket_no' => $id,
            'prescribed_at' => now(),
            'doctor_id' => $request->user()->staff_id,
        ]));

        return $this->ok($this->withAvailability($rx), 'Prescription created.', 201);
    }

    /** GET /visits/{id}/prescriptions — list with pharmacy availability. */
    public function index(Request $request, string $id): JsonResponse
    {
        $visit = Visit::findOrFail($id);
        if (! $this->canAccessPatient($request->user(), $visit->patient_serial)) {
            return $this->fail('Not allowed.', 403);
        }

        $rxs = $visit->prescriptions()->orderByDesc('prescribed_at')->get()
            ->map(fn ($rx) => $this->withAvailability($rx));

        return $this->ok($rxs);
    }

    /** POST /prescriptions/{id}/administer — MAR entry (nurse) or self-confirm (patient). */
    public function administer(Request $request, int $id): JsonResponse
    {
        $rx = Prescription::findOrFail($id);
        $user = $request->user();

        $isPatient = ! $user->isStaff();
        if ($isPatient && ! $this->canAccessPatient($user, $rx->visit?->patient_serial ?? '')) {
            return $this->fail('Not allowed.', 403);
        }

        $data = $request->validate([
            'action' => ['required', 'in:given,refused,missed,taken'],
            'scheduled_time' => ['nullable', 'date'],
            'actual_time' => ['nullable', 'date'],
            'note' => ['nullable', 'string'],
        ]);

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

        return $this->ok($mar, 'Administration logged.', 201);
    }

    /** POST /visits/{id}/reconciliation — medication reconciliation (FR6.1.2). */
    public function reconciliation(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'home_medications' => ['nullable', 'array'],
            'home_medications.*' => ['string'],
            'note' => ['nullable', 'string'],
        ]);
        $visit = Visit::findOrFail($id);

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

        return $this->ok($drugs);
    }

    private function withAvailability(Prescription $rx): array
    {
        $drug = Drug::where('drug_name', $rx->drug_name)->first();

        return array_merge($rx->toArray(), [
            'pharmacy' => $drug ? [
                'available' => $drug->currently_available,
                'stock_qty' => $drug->approx_stock_qty,
                'cardiac_protocol' => $drug->part_of_cardiac_protocol,
            ] : ['available' => null, 'note' => 'Drug not found in formulary'],
        ]);
    }
}
