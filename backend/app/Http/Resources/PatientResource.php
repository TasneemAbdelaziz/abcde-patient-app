<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'patient_serial' => $this->patient_serial,
            'national_id' => $this->national_id,
            'full_name' => $this->full_name,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'age' => $this->date_of_birth?->age,
            'gender' => $this->gender,
            'phone' => $this->phone,
            'city_district' => $this->city_district,
            'preferred_language' => $this->preferred_language,
            'decision_maker' => $this->decision_maker,
            'chronic_conditions' => $this->chronic_conditions,
            'care_points' => $this->whenLoaded('carePoints', fn () => $this->care_points_total),
            'insurance' => $this->whenLoaded('insurance', fn () => new InsuranceCoverageResource($this->insurance)),
            'companion' => $this->whenLoaded('companion', fn () => new FamilyCompanionResource($this->companion)),
            'visits' => VisitResource::collection($this->whenLoaded('visits')),
        ];
    }
}
