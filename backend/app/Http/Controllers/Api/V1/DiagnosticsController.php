<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Diagnostics\FileResultRequest;
use App\Http\Requests\Diagnostics\StoreConsultationRequest;
use App\Http\Requests\Diagnostics\StoreDiagnosisRequest;
use App\Http\Requests\Diagnostics\StoreOrderRequest;
use App\Http\Resources\ConsultationResource;
use App\Http\Resources\DiagnosisResource;
use App\Http\Resources\InsuranceCoverageResource;
use App\Http\Resources\LabResultResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PrescriptionResource;
use App\Http\Resources\RadiologyResultResource;
use App\Http\Traits\ResolvesVisit;
use App\Models\Consultation;
use App\Models\Diagnosis;
use App\Models\Order;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiagnosticsController extends Controller
{
    use ResolvesVisit;

    /** POST /visits/{id}/orders — doctor orders tests/diet/imaging (FR7.1, FR7.3). */
    public function storeOrder(StoreOrderRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $this->visit($id);

        $order = Order::create([
            'ticket_no' => $id,
            'order_type' => $data['order_type'],
            'detail' => $data['detail'],
            'status' => 'ordered',
            'ordered_by' => $request->user()->staff_id,
            'ordered_at' => now(),
        ]);

        return $this->ok(new OrderResource($order), 'Order created.', 201);
    }

    /** GET /visits/{id}/orders — doctor's orders + status (FR7.3.1). */
    public function indexOrders(string $id): JsonResponse
    {
        $this->visit($id);

        return $this->ok(OrderResource::collection(
            Order::where('ticket_no', $id)->orderByDesc('ordered_at')->get()
        ));
    }

    /** POST /orders/{id}/result — lab/doctor files a result. */
    public function fileResult(FileResultRequest $request, int $id): JsonResponse
    {
        $data = $request->validated();
        $order = Order::findOrFail($id);
        $order->update([
            'result_summary' => $data['result_summary'],
            'status' => $data['status'] ?? 'resulted',
            'resulted_at' => now(),
        ]);

        return $this->ok(new OrderResource($order), 'Result filed.');
    }

    /** GET /visits/{id}/results — labs + radiology + resulted orders (FR7.2). */
    public function results(Request $request, string $id): JsonResponse
    {
        $visit = $this->visit($id);
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $visit->patient_serial)) {
            return $deny;
        }

        return $this->ok([
            'lab_results' => LabResultResource::collection($visit->labResults()->orderBy('ordered_at')->get()),
            'radiology_results' => RadiologyResultResource::collection($visit->radiologyResults()->orderBy('ordered_at')->get()),
            'order_results' => OrderResource::collection($visit->orders()->whereNotNull('result_summary')->get()),
        ]);
    }

    /** POST /visits/{id}/diagnosis — doctor records an ICD-10 diagnosis (FR7.2.3). */
    public function storeDiagnosis(StoreDiagnosisRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $this->visit($id);

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

        return $this->ok(new DiagnosisResource($diagnosis), 'Diagnosis recorded.', 201);
    }

    /** GET /patients/{serial}/file — consolidated EMR across visits (FR7.2.2). */
    public function patientFile(Request $request, string $serial): JsonResponse
    {
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $serial)) {
            return $deny;
        }

        $patient = Patient::with([
            'insurance',
            'visits.diagnoses',
            'visits.prescriptions.drug',
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
            'insurance' => $patient->insurance ? new InsuranceCoverageResource($patient->insurance) : null,
            'visits' => $patient->visits->map(fn ($v) => [
                'ticket_no' => $v->ticket_no,
                'arrived_at' => $v->arrived_at?->toDateTimeString(),
                'arrival_type' => $v->arrival_type,
                'current_stage' => $v->current_stage,
                'visit_status' => $v->visit_status,
                'diagnoses' => DiagnosisResource::collection($v->diagnoses),
                'prescriptions' => PrescriptionResource::collection($v->prescriptions),
                'lab_results' => LabResultResource::collection($v->labResults),
                'radiology_results' => RadiologyResultResource::collection($v->radiologyResults),
                'timeline' => $v->timeline,
            ]),
        ]);
    }

    /** POST /visits/{id}/consultations — request a specialist consult (FR7.3.2). */
    public function storeConsultation(StoreConsultationRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $this->visit($id);

        $consult = Consultation::create([
            'ticket_no' => $id,
            'specialty' => $data['specialty'],
            'question' => $data['question'],
            'requested_by' => $request->user()->staff_id,
            'status' => 'open',
        ]);

        return $this->ok(new ConsultationResource($consult), 'Consultation requested.', 201);
    }
}
