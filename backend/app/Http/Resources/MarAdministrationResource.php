<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MarAdministrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'prescription_id' => $this->prescription_id,
            'drug_name' => $this->drug_name,
            'action' => $this->action,
            'scheduled_time' => $this->scheduled_time?->toDateTimeString(),
            'actual_time' => $this->actual_time?->toDateTimeString(),
            'administered_by' => $this->administered_by,
            'note' => $this->note,
        ];
    }
}
