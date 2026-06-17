<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CarePointResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_serial' => $this->patient_serial,
            'points' => $this->points,
            'reason' => $this->reason,
            'source_type' => $this->source_type,
            'source_id' => $this->source_id,
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
