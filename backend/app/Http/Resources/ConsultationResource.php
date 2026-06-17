<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConsultationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'specialty' => $this->specialty,
            'question' => $this->question,
            'reply' => $this->reply,
            'requested_by' => $this->requested_by,
            'answered_by' => $this->answered_by,
            'status' => $this->status,
        ];
    }
}
