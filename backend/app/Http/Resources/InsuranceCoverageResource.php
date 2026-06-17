<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InsuranceCoverageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'patient_serial' => $this->patient_serial,
            'coverage_category' => $this->coverage_category,
            'payer_name' => $this->payer_name,
            'policy_no' => $this->policy_no,
            'determined_from' => $this->determined_from,
            'notes' => $this->notes,
        ];
    }
}
