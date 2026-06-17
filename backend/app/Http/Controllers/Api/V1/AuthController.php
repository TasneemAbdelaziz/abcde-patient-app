<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PatientCard;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** POST /auth/login — staff by email, patients by phone/serial. */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string'], // email | phone | patient_serial | username | national_id
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $id = $data['identifier'];
        $user = User::where('username', $id)
            ->orWhere('email', $id)
            ->orWhere('patient_serial', $id)
            ->orWhereHas('patient', fn ($q) => $q->where('national_id', $id))
            ->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'identifier' => [__('These credentials do not match our records.')],
            ]);
        }

        if (! $user->is_active) {
            return $this->fail('Account is disabled.', 403);
        }

        return $this->issueToken($user, $data['device_name'] ?? 'app');
    }

    /** POST /auth/login/qr — login with a card QR token (FR1.1.2). */
    public function loginQr(Request $request): JsonResponse
    {
        $data = $request->validate(['qr_token' => ['required', 'string']]);

        $card = PatientCard::where('qr_token', $data['qr_token'])->first();
        $user = $card?->patient?->user
            ?? User::where('username', $data['qr_token'])->first();

        if (! $user) {
            return $this->fail('Invalid or expired QR code.', 401);
        }

        return $this->issueToken($user, 'qr');
    }

    /**
     * POST /patients/register — create a patient (FR-1.2 / FR-1.4).
     *
     * Two callers share this endpoint (auth.optional):
     *  - A guest self-registers and is logged in (a token is returned).
     *  - Reception/admin adds a patient at the desk: the new patient + Serial are
     *    returned and the staff member keeps their own session (no patient token).
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'national_id' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'in:M,F'],
            'phone' => ['required', 'string', 'max:30'],
            'city_district' => ['nullable', 'string', 'max:120'],
            'preferred_language' => ['nullable', 'in:ar,en,ru,zh'],
            'decision_maker' => ['nullable', 'string', 'max:255'],
            'chronic_conditions' => ['nullable', 'string'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        if (User::where('username', $data['phone'])->exists()) {
            throw ValidationException::withMessages([
                'phone' => [__('An account with this phone number already exists.')],
            ]);
        }

        // The Serial is built from the national ID and reused across visits, so a
        // national ID that already exists is caught — nobody gets a second Serial (FR-1.4).
        if (! empty($data['national_id']) && Patient::where('national_id', $data['national_id'])->exists()) {
            throw ValidationException::withMessages([
                'national_id' => [__('A patient with this national ID already exists.')],
            ]);
        }

        $serial = $this->nextPatientSerial();

        $patient = Patient::create([
            'patient_serial' => $serial,
            'national_id' => $data['national_id'] ?? null,
            'full_name' => $data['full_name'],
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'phone' => $data['phone'],
            'city_district' => $data['city_district'] ?? null,
            'preferred_language' => $data['preferred_language'] ?? 'ar',
            'decision_maker' => $data['decision_maker'] ?? 'self',
            'chronic_conditions' => $data['chronic_conditions'] ?? null,
        ]);

        $user = User::create([
            'name' => $patient->full_name,
            'username' => $patient->phone,
            'role' => 'patient',
            'patient_serial' => $patient->patient_serial,
            'password' => Hash::make($data['password'] ?? Str::random(10)),
            'locale' => $patient->preferred_language,
        ]);
        $patient->update(['user_id' => $user->id]);

        // Reception/admin adding a patient at the desk: return the record + Serial,
        // and keep the staff member's own session (do not issue a patient token).
        if ($request->user()?->isStaff()) {
            return $this->ok([
                'patient_serial' => $patient->patient_serial,
                'patient' => $patient->fresh(),
            ], 'Patient registered.', 201);
        }

        // Guest self-registration: log the new patient in.
        return $this->issueToken($user, 'registration', 201);
    }

    /** POST /auth/logout — revoke current token. */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->ok(null, 'Logged out.');
    }

    /** GET /auth/me — current identity + linked profile. */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['staff', 'patient']);

        return $this->ok([
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
            'locale' => $user->locale,
            'national_id' => $user->patient?->national_id,
            'staff' => $user->staff,
            'patient' => $user->patient,
        ]);
    }

    private function issueToken(User $user, string $device, int $status = 200): JsonResponse
    {
        $token = $user->createToken($device, [$user->role])->plainTextToken;

        return $this->ok([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'locale' => $user->locale,
                'patient_serial' => $user->patient_serial,
                'national_id' => $user->patient?->national_id,
                'staff_id' => $user->staff_id,
            ],
        ], 'Authenticated.', $status);
    }

    private function nextPatientSerial(): string
    {
        $last = Patient::where('patient_serial', 'like', 'ALM-%')
            ->orderByDesc('patient_serial')
            ->value('patient_serial');
        $n = $last ? (int) Str::after($last, 'ALM-') : 20500;

        return 'ALM-' . ($n + 1);
    }
}
