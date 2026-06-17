<?php

namespace App\Http\Traits;

use App\Models\User;
use Illuminate\Http\JsonResponse;

/**
 * Patient-record access rules (BR-3 / BR-4 / FR-1.7).
 *
 * Staff may access any patient; a patient — or their one linked family
 * companion — may only access their own record.
 */
trait AuthorizesPatientAccess
{
    protected function canAccessPatient(?User $user, ?string $patientSerial): bool
    {
        if (! $user || $patientSerial === null || $patientSerial === '') {
            return false;
        }
        if ($user->isStaff()) {
            return true;
        }

        return $user->patient_serial === $patientSerial;
    }

    /**
     * Guard helper: returns a localized 403 response when access is denied, or
     * null when it is allowed. Usage:
     *
     *   if ($deny = $this->denyUnlessPatientAccess($user, $serial)) return $deny;
     */
    protected function denyUnlessPatientAccess(?User $user, ?string $patientSerial, string $message = 'Not allowed.'): ?JsonResponse
    {
        return $this->canAccessPatient($user, $patientSerial) ? null : $this->fail($message, 403);
    }
}
