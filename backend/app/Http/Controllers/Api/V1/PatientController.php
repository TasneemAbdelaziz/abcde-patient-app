<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientResource;
use App\Models\AccessibilitySetting;
use App\Models\Patient;
use App\Models\PatientCard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
        if (! $this->canAccessPatient($request->user(), $serial)) {
            return $this->fail('You may only view your own record.', 403);
        }

        $patient = Patient::with(['insurance', 'companion', 'carePoints'])->findOrFail($serial);

        return $this->ok(new PatientResource($patient));
    }

    /** PUT /patients/{serial}/preferences — language, decision maker, etc. (FR1.2.2). */
    public function updatePreferences(Request $request, string $serial): JsonResponse
    {
        if (! $this->canAccessPatient($request->user(), $serial)) {
            return $this->fail('Not allowed.', 403);
        }

        $data = $request->validate([
            'preferred_language' => ['nullable', 'in:ar,en,ru,zh'],
            'decision_maker' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'city_district' => ['nullable', 'string', 'max:120'],
        ]);

        $patient = Patient::findOrFail($serial);
        $patient->update(array_filter($data, fn ($v) => $v !== null));

        return $this->ok(new PatientResource($patient->fresh()), 'Preferences updated.');
    }

    /** POST /patients/{serial}/cards — issue an ID card with barcode (FR1.2.1, reception). */
    public function issueCard(Request $request, string $serial): JsonResponse
    {
        $data = $request->validate([
            'card_type' => ['required', 'in:arrival,booking'],
        ]);
        Patient::findOrFail($serial);

        $card = PatientCard::create([
            'patient_serial' => $serial,
            'card_type' => $data['card_type'],
            'barcode' => $this->code('BC'),
            'qr_token' => $this->code('QR'),
            'issued_by' => $request->user()->staff_id,
            'issued_at' => now(),
        ]);

        return $this->ok([
            'id' => $card->id,
            'patient_serial' => $card->patient_serial,
            'card_type' => $card->card_type,
            'barcode' => $card->barcode,
            'qr_token' => $card->qr_token,
            'issued_at' => $card->issued_at?->toDateTimeString(),
        ], 'Card issued.', 201);
    }

    /** POST /patients/{serial}/qr — (re)issue a login QR token (FR1.1.2, reception). */
    public function issueQr(Request $request, string $serial): JsonResponse
    {
        Patient::findOrFail($serial);

        $card = PatientCard::create([
            'patient_serial' => $serial,
            'card_type' => 'arrival',
            'barcode' => $this->code('BC'),
            'qr_token' => $this->code('QR'),
            'issued_by' => $request->user()->staff_id,
            'issued_at' => now(),
        ]);

        return $this->ok(['qr_token' => $card->qr_token], 'QR issued.', 201);
    }

    /** GET /patients/{serial}/accessibility — accessibility profile (FR16). */
    public function accessibility(Request $request, string $serial): JsonResponse
    {
        if (! $this->canAccessPatient($request->user(), $serial)) {
            return $this->fail('Not allowed.', 403);
        }

        $settings = AccessibilitySetting::firstOrNew(['patient_serial' => $serial]);

        return $this->ok($settings);
    }

    /** PUT /patients/{serial}/accessibility — update accessibility profile (FR16). */
    public function updateAccessibility(Request $request, string $serial): JsonResponse
    {
        if (! $this->canAccessPatient($request->user(), $serial)) {
            return $this->fail('Not allowed.', 403);
        }

        $data = $request->validate([
            'high_contrast' => ['nullable', 'boolean'],
            'screen_reader' => ['nullable', 'boolean'],
            'text_to_speech' => ['nullable', 'boolean'],
            'captions' => ['nullable', 'boolean'],
            'haptics' => ['nullable', 'boolean'],
            'simple_mode' => ['nullable', 'boolean'],
            'font_scale' => ['nullable', 'numeric', 'between:0.8,3'],
            'extra' => ['nullable', 'array'],
        ]);

        $settings = AccessibilitySetting::updateOrCreate(
            ['patient_serial' => $serial],
            $data
        );

        return $this->ok($settings, 'Accessibility updated.');
    }

    private function code(string $prefix): string
    {
        return $prefix . '-' . strtoupper(Str::random(10));
    }
}
