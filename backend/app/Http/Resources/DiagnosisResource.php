<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiagnosisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'icd10_code' => $this->icd10_code,
            'diagnosis' => $this->diagnosis,
            'is_primary' => (bool) $this->is_primary,
            'doctor_id' => $this->doctor_id,
        ];
    }
}
