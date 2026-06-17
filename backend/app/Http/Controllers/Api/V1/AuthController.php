<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\QrLoginRequest;
use App\Http\Requests\Auth\RegisterPatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use App\Models\PatientCard;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** POST /auth/login — staff by email, patients by phone/serial/national id. */
    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
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
    public function loginQr(QrLoginRequest $request): JsonResponse
    {
        $token = $request->validated()['qr_token'];

        $card = PatientCard::where('qr_token', $token)->first();
        $user = $card?->patient?->user ?? User::where('username', $token)->first();

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
     *
     * Phone/national-id uniqueness (FR-1.4) is enforced by {@see RegisterPatientRequest}.
     */
    public function register(RegisterPatientRequest $request): JsonResponse
    {
        $data = $request->validated();

        $patient = Patient::create([
            'patient_serial' => Patient::nextSerial(),
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

        // Reception/admin at the desk: return the record + Serial, keep their session.
        if ($request->user()?->isStaff()) {
            return $this->ok([
                'patient_serial' => $patient->patient_serial,
                'patient' => new PatientResource($patient->fresh()),
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
}
