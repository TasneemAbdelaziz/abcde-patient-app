<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

abstract class Controller
{
    /**
     * Whether the user may access a given patient's records.
     * Staff may access anyone; a patient or their linked family only themselves.
     */
    protected function canAccessPatient(?User $user, string $patientSerial): bool
    {
        if (! $user) {
            return false;
        }
        if ($user->isStaff()) {
            return true;
        }

        return $user->patient_serial === $patientSerial;
    }

    /**
     * Standard success envelope. The message is run through the translator
     * (JSON lang files) so it is returned in the negotiated locale.
     *
     * @param  array<string,mixed>  $replace  translation placeholders
     */
    protected function ok(mixed $data = null, ?string $message = null, int $status = 200, array $replace = []): JsonResponse
    {
        $payload = ['success' => true];
        if ($message !== null) {
            $payload['message'] = __($message, $replace);
        }
        $payload['data'] = $data;
        $payload['meta'] = ['locale' => app()->getLocale()];

        return response()->json($payload, $status);
    }

    /** Standard error envelope (message localized). */
    protected function fail(string $message, int $status = 400, array $extra = [], array $replace = []): JsonResponse
    {
        return response()->json(array_merge([
            'success' => false,
            'message' => __($message, $replace),
            'meta' => ['locale' => app()->getLocale()],
        ], $extra), $status);
    }
}
