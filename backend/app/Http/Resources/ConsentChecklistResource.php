<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConsentChecklistResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'record_type' => $this->record_type,
            'item' => $this->item,
            'decision' => $this->decision,
            'responded_by' => $this->responded_by,
            'requested_at' => $this->requested_at?->toDateTimeString(),
            'responded_at' => $this->responded_at?->toDateTimeString(),
        ];
    }
}
