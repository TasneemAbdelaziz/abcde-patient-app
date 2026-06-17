<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RadiologyResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'study' => $this->study,
            'report_summary' => $this->report_summary,
            'reporting_doctor' => $this->reporting_doctor,
            'ordered_at' => $this->ordered_at?->toDateTimeString(),
            'performed_at' => $this->performed_at?->toDateTimeString(),
        ];
    }
}
