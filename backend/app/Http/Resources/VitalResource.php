<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VitalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'taken_at' => $this->taken_at?->toDateTimeString(),
            'nurse_id' => $this->nurse_id,
            'systolic_bp' => $this->systolic_bp,
            'diastolic_bp' => $this->diastolic_bp,
            'pulse' => $this->pulse,
            'respiratory_rate' => $this->respiratory_rate,
            'spo2' => $this->spo2,
            'temperature' => $this->temperature,
            'pain_score' => $this->pain_score,
            'consciousness_avpu' => $this->consciousness_avpu,
            'news2_score' => $this->news2_score,
            'risk_level' => $this->risk_level,
        ];
    }
}
