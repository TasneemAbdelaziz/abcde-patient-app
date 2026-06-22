<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Drug;
use App\Models\EducationContent;
use App\Models\HospitalSetting;
use App\Models\Patient;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

/**
 * S12 — Admin content management (admin only).
 *
 * Lets the administrator edit the site's content end to end: departments,
 * education media (images / videos / articles), the medication catalogue,
 * hospital/site settings, and patient & visit records — plus an image/video
 * upload endpoint. Every response uses the standard localized envelope.
 */
class AdminContentController extends Controller
{
    private function validated(Request $request, array $rules): array
    {
        return Validator::make($request->all(), $rules)->validate();
    }

    /* ===================== Departments ===================== */
    public function departments(): JsonResponse
    {
        return $this->ok(Department::orderBy('department_name')->get());
    }

    public function storeDepartment(Request $request): JsonResponse
    {
        $data = $this->validated($request, [
            'dept_code' => ['required', 'string', 'max:20', 'unique:departments,dept_code'],
            'department_name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'accepts_bookings' => ['boolean'],
            'head_of_department' => ['nullable', 'string', 'max:160'],
        ]);

        return $this->ok(Department::create($data), 'Department created.', 201);
    }

    public function updateDepartment(Request $request, string $code): JsonResponse
    {
        $dept = Department::findOrFail($code);
        $data = $this->validated($request, [
            'department_name' => ['sometimes', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'accepts_bookings' => ['boolean'],
            'head_of_department' => ['nullable', 'string', 'max:160'],
        ]);
        $dept->update($data);

        return $this->ok($dept->fresh(), 'Department updated.');
    }

    public function destroyDepartment(string $code): JsonResponse
    {
        Department::findOrFail($code)->delete();

        return $this->ok(null, 'Department deleted.');
    }

    /* ===================== Education content (images / videos / articles) ===================== */
    public function education(): JsonResponse
    {
        return $this->ok(EducationContent::orderByDesc('id')->get());
    }

    public function storeEducation(Request $request): JsonResponse
    {
        $data = $this->validated($request, $this->educationRules(true));

        return $this->ok(EducationContent::create($data), 'Education content created.', 201);
    }

    public function updateEducation(Request $request, int $id): JsonResponse
    {
        $item = EducationContent::findOrFail($id);
        $item->update($this->validated($request, $this->educationRules(false)));

        return $this->ok($item->fresh(), 'Education content updated.');
    }

    public function destroyEducation(int $id): JsonResponse
    {
        EducationContent::findOrFail($id)->delete();

        return $this->ok(null, 'Education content deleted.');
    }

    private function educationRules(bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return [
            'title' => [$req, 'string', 'max:200'],
            'content_type' => [$req, 'in:video,article,audio,image,game'],
            'condition' => ['nullable', 'string', 'max:80'],
            'journey_stage' => ['nullable', 'string', 'max:40'],
            'duration_min' => ['nullable', 'integer', 'min:0'],
            'file_or_link' => ['nullable', 'string', 'max:500'], // URL or uploaded media path
            'approved_by' => ['nullable', 'string', 'max:160'],
        ];
    }

    /* ===================== Drugs / medications catalogue ===================== */
    public function drugs(): JsonResponse
    {
        return $this->ok(Drug::orderBy('drug_name')->get());
    }

    public function storeDrug(Request $request): JsonResponse
    {
        $data = $this->validated($request, $this->drugRules(true));

        return $this->ok(Drug::create($data), 'Drug created.', 201);
    }

    public function updateDrug(Request $request, int $id): JsonResponse
    {
        $drug = Drug::findOrFail($id);
        $drug->update($this->validated($request, $this->drugRules(false)));

        return $this->ok($drug->fresh(), 'Drug updated.');
    }

    public function destroyDrug(int $id): JsonResponse
    {
        Drug::findOrFail($id)->delete();

        return $this->ok(null, 'Drug deleted.');
    }

    private function drugRules(bool $creating): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return [
            'drug_name' => [$req, 'string', 'max:160'],
            'form' => ['nullable', 'string', 'max:60'],
            'strength' => ['nullable', 'string', 'max:60'],
            'code' => ['nullable', 'string', 'max:60'],
            'currently_available' => ['boolean'],
            'approx_stock_qty' => ['nullable', 'integer', 'min:0'],
            'part_of_cardiac_protocol' => ['boolean'],
        ];
    }

    /* ===================== Hospital / site settings ===================== */
    public function hospital(): JsonResponse
    {
        return $this->ok(HospitalSetting::pluck('value', 'field'));
    }

    public function updateHospital(Request $request): JsonResponse
    {
        $data = $this->validated($request, ['settings' => ['required', 'array']]);
        foreach ($data['settings'] as $field => $value) {
            HospitalSetting::updateOrCreate(['field' => (string) $field], ['value' => $value]);
        }

        return $this->ok(HospitalSetting::pluck('value', 'field'), 'Hospital settings updated.');
    }

    /* ===================== Patient & visit records ===================== */
    public function updatePatient(Request $request, string $serial): JsonResponse
    {
        $patient = Patient::where('patient_serial', $serial)->firstOrFail();
        $data = $this->validated($request, [
            'full_name' => ['sometimes', 'string', 'max:160'],
            'national_id' => ['sometimes', 'nullable', 'string', 'max:30', 'unique:patients,national_id,'.$serial.',patient_serial'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'in:M,F'],
            'phone' => ['sometimes', 'string', 'max:40'],
            'city_district' => ['nullable', 'string', 'max:120'],
            'preferred_language' => ['nullable', 'in:ar,en,ru,zh'],
            'decision_maker' => ['nullable', 'string', 'max:60'],
            'chronic_conditions' => ['nullable', 'string'],
        ]);
        $patient->update($data);

        return $this->ok($patient->fresh(), 'Patient updated.');
    }

    public function updateVisit(Request $request, string $id): JsonResponse
    {
        $visit = Visit::where('ticket_no', $id)->firstOrFail();
        $data = $this->validated($request, [
            'arrival_type' => ['sometimes', 'in:emergency,scheduled,cold,referred'],
            'triage_classification' => ['nullable', 'in:cold,emergency,critical'],
            'dept_code' => ['sometimes', 'string', 'exists:departments,dept_code'],
            'treating_doctor_id' => ['nullable', 'string'],
            'location_code' => ['nullable', 'string', 'max:40'],
            'current_stage' => ['sometimes', 'in:'.implode(',', Visit::STAGES)],
            'catheterization_type' => ['nullable', 'in:cerebral,cardiac,peripheral,interventional_radiology'],
            'visit_status' => ['sometimes', 'in:open,closed'],
        ]);
        $visit->update($data);

        return $this->ok($visit->fresh(), 'Visit updated.');
    }

    /* ===================== Media upload (images / videos) ===================== */
    public function uploadMedia(Request $request): JsonResponse
    {
        $this->validated($request, [
            'file' => ['required', 'file', 'max:51200', // 50 MB
                'mimes:jpg,jpeg,png,gif,webp,svg,mp4,webm,mov,m4v,mp3,wav,pdf'],
        ]);

        $path = $request->file('file')->store('media', 'public');

        return $this->ok([
            'path' => $path,
            'url' => url('storage/'.$path),
            'name' => $request->file('file')->getClientOriginalName(),
            'mime' => $request->file('file')->getClientMimeType(),
            'size' => $request->file('file')->getSize(),
        ], 'File uploaded.', 201);
    }
}
