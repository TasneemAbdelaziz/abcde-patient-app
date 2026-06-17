<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmergencySosResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'event_id' => $this->event_id,
            'event_type' => $this->event_type,
            'ticket_no' => $this->ticket_no,
            'triggered_by' => $this->triggered_by,
            'classification' => $this->classification,
            'answered_by' => $this->answered_by,
            'is_active' => $this->resolved_at === null,
            'response_seconds' => $this->response_seconds,
            'started_at' => $this->started_at?->toDateTimeString(),
            'physician_alerted_at' => $this->physician_alerted_at?->toDateTimeString(),
            'nursing_alerted_at' => $this->nursing_alerted_at?->toDateTimeString(),
            'family_alerted_at' => $this->family_alerted_at?->toDateTimeString(),
            'resolved_at' => $this->resolved_at?->toDateTimeString(),
        ];
    }
}
