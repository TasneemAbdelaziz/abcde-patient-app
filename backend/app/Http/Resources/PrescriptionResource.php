<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrescriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'drug_name' => $this->drug_name,
            'dose' => $this->dose,
            'route' => $this->route,
            'frequency' => $this->frequency,
            'duration_days' => $this->duration_days,
            'patient_instructions' => $this->patient_instructions,
            'prescribed_at' => $this->prescribed_at?->toDateTimeString(),
            'doctor_id' => $this->doctor_id,
            'pharmacy' => $this->pharmacy(),
        ];
    }

    /** Pharmacy availability for the prescribed drug. Eager-load `drug` to avoid N+1. */
    private function pharmacy(): array
    {
        $drug = $this->drug;

        return $drug ? [
            'available' => (bool) $drug->currently_available,
            'stock_qty' => $drug->approx_stock_qty,
            'cardiac_protocol' => (bool) $drug->part_of_cardiac_protocol,
        ] : ['available' => null, 'note' => 'Drug not found in formulary'];
    }
}
