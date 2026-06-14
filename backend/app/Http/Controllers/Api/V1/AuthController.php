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
            'identifier' => ['required', 'string'], // email | phone | patient_serial | username
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $id = $data['identifier'];
        $user = User::where('username', $id)
            ->orWhere('email', $id)
            ->orWhere('patient_serial', $id)
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

    /** POST /patients/register — self/family/reception registration (FR1.2.1). */
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
