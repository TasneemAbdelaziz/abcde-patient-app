<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'appointment_id' => $this->appointment_id,
            'patient_serial' => $this->patient_serial,
            'patient_or_guest' => $this->patient_serial_or_guest,
            'is_guest' => $this->is_guest,
            'dept_code' => $this->dept_code,
            'complaint' => $this->complaint,
            'status' => $this->status,
            'assigned_doctor_id' => $this->assigned_doctor_id,
            'requested_at' => $this->requested_at?->toDateTimeString(),
            'scheduled_at' => $this->scheduled_at?->toDateTimeString(),
            'department' => $this->whenLoaded('department'),
            'doctor' => $this->whenLoaded('doctor'),
        ];
    }
}
