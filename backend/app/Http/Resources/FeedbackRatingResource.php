<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeedbackRatingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'stage' => $this->stage,
            'rated_by' => $this->rated_by,
            'stars' => $this->stars,
            'comment' => $this->comment,
            'rated_at' => $this->rated_at?->toDateTimeString(),
        ];
    }
}
