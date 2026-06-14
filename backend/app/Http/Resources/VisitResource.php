<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VisitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'ticket_no' => $this->ticket_no,
            'patient_serial' => $this->patient_serial,
            'arrival_type' => $this->arrival_type,
            'arrived_at' => $this->arrived_at?->toDateTimeString(),
            'triage_classification' => $this->triage_classification,
            'dept_code' => $this->dept_code,
            'treating_doctor_id' => $this->treating_doctor_id,
            'location_code' => $this->location_code,
            'current_stage' => $this->current_stage,
            'door_time' => $this->door_time?->toDateTimeString(),
            'balloon_time' => $this->balloon_time?->toDateTimeString(),
            'door_to_balloon_minutes' => $this->door_to_balloon_minutes,
            'catheterization_type' => $this->catheterization_type,
            'visit_status' => $this->visit_status,
            'patient' => new PatientResource($this->whenLoaded('patient')),
            'doctor' => $this->whenLoaded('doctor'),
            'department' => $this->whenLoaded('department'),
            'location' => $this->whenLoaded('location'),
            'timeline' => $this->whenLoaded('timeline'),
            'vitals' => VitalResource::collection($this->whenLoaded('vitals')),
            'diagnoses' => $this->whenLoaded('diagnoses'),
            'prescriptions' => $this->whenLoaded('prescriptions'),
            'lab_results' => $this->whenLoaded('labResults'),
            'radiology_results' => $this->whenLoaded('radiologyResults'),
            'care_plan' => $this->whenLoaded('carePlan'),
        ];
    }
}
