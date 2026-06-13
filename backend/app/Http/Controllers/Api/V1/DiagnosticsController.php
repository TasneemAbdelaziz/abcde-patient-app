<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Diagnosis;
use App\Models\Order;
use App\Models\Patient;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiagnosticsController extends Controller
{
    /** POST /visits/{id}/orders — doctor orders tests/diet/imaging (FR7.1, FR7.3). */
    public function storeOrder(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'order_type' => ['required', 'in:lab,radiology,medication,diet,imaging'],
            'detail' => ['required', 'string'],
        ]);
        Visit::findOrFail($id);

        $order = Order::create([
            'ticket_no' => $id,
            'order_type' => $data['order_type'],
            'detail' => $data['detail'],
            'status' => 'ordered',
            'ordered_by' => $request->user()->staff_id,
            'ordered_at' => now(),
        ]);

        return $this->ok($order, 'Order created.', 201);
    }

    /** GET /visits/{id}/orders — doctor's orders + status (FR7.3.1). */
    public function indexOrders(Request $request, string $id): JsonResponse
    {
        Visit::findOrFail($id);

        return $this->ok(
            Order::where('ticket_no', $id)->orderByDesc('ordered_at')->get()
        );
    }

    /** POST /orders/{id}/result — lab/doctor files a result. */
    public function fileResult(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'result_summary' => ['required', 'string'],
            'status' => ['nullable', 'in:resulted,in_progress,cancelled'],
        ]);
        $order = Order::findOrFail($id);
        $order->update([
            'result_summary' => $data['result_summary'],
            'status' => $data['status'] ?? 'resulted',
            'resulted_at' => now(),
        ]);

        return $this->ok($order, 'Result filed.');
    }

    /** GET /visits/{id}/results — labs + radiology + resulted orders (FR7.2). */
    public function results(Request $request, string $id): JsonResponse
    {
        $visit = Visit::findOrFail($id);
        if (! $this->canAccessPatient($request->user(), $visit->patient_serial)) {
            return $this->fail('Not allowed.', 403);
        }

        return $this->ok([
            'lab_results' => $visit->labResults()->orderBy('ordered_at')->get(),
            'radiology_results' => $visit->radiologyResults()->orderBy('ordered_at')->get(),
            'order_results' => $visit->orders()->whereNotNull('result_summary')->get(),
        ]);
    }

    /** POST /visits/{id}/diagnosis — doctor records an ICD-10 diagnosis (FR7.2.3). */
    public function storeDiagnosis(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'icd10_code' => ['nullable', 'string', 'max:20'],
            'diagnosis' => ['required', 'string'],
            'is_primary' => ['nullable', 'boolean'],
        ]);
        Visit::findOrFail($id);

        // Only one primary diagnosis per visit.
        if ($data['is_primary'] ?? false) {
            Diagnosis::where('ticket_no', $id)->update(['is_primary' => false]);
        }

        $diagnosis = Diagnosis::create([
            'ticket_no' => $id,
            'icd10_code' => $data['icd10_code'] ?? null,
            'diagnosis' => $data['diagnosis'],
            'is_primary' => $data['is_primary'] ?? false,
            'doctor_id' => $request->user()->staff_id,
        ]);

        return $this->ok($diagnosis, 'Diagnosis recorded.', 201);
    }

    /** GET /patients/{serial}/file — consolidated EMR across visits (FR7.2.2). */
    public function patientFile(Request $request, string $serial): JsonResponse
    {
        if (! $this->canAccessPatient($request->user(), $serial)) {
            return $this->fail('Not allowed.', 403);
        }

        $patient = Patient::with([
            'insurance',
            'visits.diagnoses',
            'visits.prescriptions',
            'visits.labResults',
            'visits.radiologyResults',
            'visits.timeline',
        ])->findOrFail($serial);

        return $this->ok([
            'patient' => [
                'patient_serial' => $patient->patient_serial,
                'full_name' => $patient->full_name,
                'date_of_birth' => $patient->date_of_birth?->toDateString(),
                'gender' => $patient->gender,
                'chronic_conditions' => $patient->chronic_conditions,
                'preferred_language' => $patient->preferred_language,
            ],
            'insurance' => $patient->insurance,
            'visits' => $patient->visits->map(fn ($v) => [
                'ticket_no' => $v->ticket_no,
                'arrived_at' => $v->arrived_at?->toDateTimeString(),
                'arrival_type' => $v->arrival_type,
                'current_stage' => $v->current_stage,
                'visit_status' => $v->visit_status,
                'diagnoses' => $v->diagnoses,
                'prescriptions' => $v->prescriptions,
                'lab_results' => $v->labResults,
                'radiology_results' => $v->radiologyResults,
                'timeline' => $v->timeline,
            ]),
        ]);
    }

    /** POST /visits/{id}/consultations — request a specialist consult (FR7.3.2). */
    public function storeConsultation(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'specialty' => ['required', 'string'],
            'question' => ['required', 'string'],
        ]);
        Visit::findOrFail($id);

        $consult = Consultation::create([
            'ticket_no' => $id,
            'specialty' => $data['specialty'],
            'question' => $data['question'],
            'requested_by' => $request->user()->staff_id,
            'status' => 'open',
        ]);

        return $this->ok($consult, 'Consultation requested.', 201);
    }
}
