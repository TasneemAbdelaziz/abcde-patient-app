<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommitteeReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'review_type' => $this->review_type,
            'reason' => $this->reason,
            'members' => $this->members,
            'decision' => $this->decision,
            'memo' => $this->memo,
            'decided_by' => $this->decided_by,
            'decided_at' => $this->decided_at?->toDateTimeString(),
        ];
    }
}
