<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\IssueCardRequest;
use App\Http\Requests\Patient\UpdateAccessibilityRequest;
use App\Http\Requests\Patient\UpdatePatientPreferencesRequest;
use App\Http\Resources\AccessibilitySettingResource;
use App\Http\Resources\PatientCardResource;
use App\Http\Resources\PatientResource;
use App\Models\AccessibilitySetting;
use App\Models\Patient;
use App\Models\PatientCard;
use App\Support\Reference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    /** GET /patients?q= — staff search by serial/name/national id/phone. */
    public function index(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        $patients = Patient::query()
            ->when($q !== '', function ($query) use ($q) {
                $query->where('patient_serial', 'like', "%{$q}%")
                    ->orWhere('full_name', 'like', "%{$q}%")
                    ->orWhere('national_id', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            })
            ->orderBy('full_name')
            ->paginate($request->integer('per_page', 25));

        return $this->ok([
            'items' => PatientResource::collection($patients->items()),
            'meta' => [
                'total' => $patients->total(),
                'page' => $patients->currentPage(),
                'per_page' => $patients->perPage(),
            ],
        ]);
    }

    /** GET /patients/{serial} — full profile (owner or staff). */
    public function show(Request $request, string $serial): JsonResponse
    {
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $serial, 'You may only view your own record.')) {
            return $deny;
        }

        $patient = Patient::with(['insurance', 'companion', 'carePoints'])->findOrFail($serial);

        return $this->ok(new PatientResource($patient));
    }

    /** PUT /patients/{serial}/preferences — language, decision maker, etc. (FR1.2.2). */
    public function updatePreferences(UpdatePatientPreferencesRequest $request, string $serial): JsonResponse
    {
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $serial)) {
            return $deny;
        }

        $patient = Patient::findOrFail($serial);
        $patient->update(array_filter($request->validated(), fn ($v) => $v !== null));

        return $this->ok(new PatientResource($patient->fresh()), 'Preferences updated.');
    }

    /** POST /patients/{serial}/cards — issue an ID card with barcode (FR1.2.1, reception). */
    public function issueCard(IssueCardRequest $request, string $serial): JsonResponse
    {
        Patient::findOrFail($serial);

        $card = PatientCard::create([
            'patient_serial' => $serial,
            'card_type' => $request->validated()['card_type'],
            'barcode' => Reference::code('BC', 10),
            'qr_token' => Reference::code('QR', 10),
            'issued_by' => $request->user()->staff_id,
            'issued_at' => now(),
        ]);

        return $this->ok(new PatientCardResource($card), 'Card issued.', 201);
    }

    /** POST /patients/{serial}/qr — (re)issue a login QR token (FR1.1.2, reception). */
    public function issueQr(Request $request, string $serial): JsonResponse
    {
        Patient::findOrFail($serial);

        $card = PatientCard::create([
            'patient_serial' => $serial,
            'card_type' => 'arrival',
            'barcode' => Reference::code('BC', 10),
            'qr_token' => Reference::code('QR', 10),
            'issued_by' => $request->user()->staff_id,
            'issued_at' => now(),
        ]);

        return $this->ok(['qr_token' => $card->qr_token], 'QR issued.', 201);
    }

    /** GET /patients/{serial}/accessibility — accessibility profile (FR16). */
    public function accessibility(Request $request, string $serial): JsonResponse
    {
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $serial)) {
            return $deny;
        }

        $settings = AccessibilitySetting::firstOrNew(['patient_serial' => $serial]);

        return $this->ok(new AccessibilitySettingResource($settings));
    }

    /** PUT /patients/{serial}/accessibility — update accessibility profile (FR16). */
    public function updateAccessibility(UpdateAccessibilityRequest $request, string $serial): JsonResponse
    {
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $serial)) {
            return $deny;
        }

        $settings = AccessibilitySetting::updateOrCreate(
            ['patient_serial' => $serial],
            $request->validated(),
        );

        return $this->ok(new AccessibilitySettingResource($settings), 'Accessibility updated.');
    }
}
