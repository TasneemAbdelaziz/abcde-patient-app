<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_serial' => $this->patient_serial,
            'card_type' => $this->card_type,
            'barcode' => $this->barcode,
            'qr_token' => $this->qr_token,
            'issued_by' => $this->issued_by,
            'issued_at' => $this->issued_at?->toDateTimeString(),
        ];
    }
}
