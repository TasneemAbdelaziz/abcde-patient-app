<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Patient;
use App\Models\Visit;

/**
 * Fan-out helper for patient/family notifications (FR12). Titles/bodies are
 * passed as translation keys and rendered in the *recipient's* preferred
 * language (not the request locale), so a patient always reads alerts in their
 * own language even when staff trigger them. In production this would also push
 * via FCM/WebSockets; here it persists rows the GET /notifications endpoint serves.
 *
 * @param  array<string,mixed>  $replace  translation placeholders
 */
class NotificationService
{
    public function toPatient(
        string $patientSerial,
        string $titleKey,
        string $type = 'update',
        ?string $bodyKey = null,
        array $data = [],
        array $replace = [],
    ): Notification {
        $locale = Patient::find($patientSerial)?->preferred_language ?: app()->getLocale();

        return Notification::create([
            'patient_serial' => $patientSerial,
            'type' => $type,
            'title' => __($titleKey, $replace, $locale),
            'body' => $bodyKey ? __($bodyKey, $replace, $locale) : null,
            'data' => $data ?: null,
        ]);
    }

    /** Notify the patient and, when permitted, their family companion. */
    public function toPatientAndFamily(
        Visit $visit,
        string $titleKey,
        string $type = 'update',
        ?string $bodyKey = null,
        array $data = [],
        array $replace = [],
    ): void {
        $this->toPatient($visit->patient_serial, $titleKey, $type, $bodyKey, $data, $replace);

        $companion = Patient::find($visit->patient_serial)?->companion;
        if ($companion && $companion->receives_alerts && $companion->user_id) {
            $locale = $companion->user?->locale ?: 'ar';
            Notification::create([
                'patient_serial' => $visit->patient_serial,
                'user_id' => $companion->user_id,
                'type' => $type,
                'title' => __($titleKey, $replace, $locale),
                'body' => $bodyKey ? __($bodyKey, $replace, $locale) : null,
                'data' => $data ?: null,
            ]);
        }
    }
}
