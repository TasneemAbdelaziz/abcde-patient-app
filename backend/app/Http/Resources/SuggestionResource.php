<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SuggestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'suggestion_no' => $this->suggestion_no,
            'patient_serial' => $this->patient_serial,
            'area' => $this->area,
            'suggestion_text' => $this->suggestion_text,
            'ticket_no' => $this->ticket_no,
            'status' => $this->status,
            'submitted_at' => $this->submitted_at?->toDateTimeString(),
        ];
    }
}
