<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComplaintResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'complaint_no' => $this->complaint_no,
            'ticket_no' => $this->ticket_no,
            'stage' => $this->stage,
            'complaint_text' => $this->complaint_text,
            'routed_to_dept' => $this->routed_to_dept,
            'status' => $this->status,
            'submitted_at' => $this->submitted_at?->toDateTimeString(),
            'responded_at' => $this->responded_at?->toDateTimeString(),
            'answered_within_sla' => $this->answered_within_sla,
        ];
    }
}
