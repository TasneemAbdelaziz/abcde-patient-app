<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OverallRatingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'rating_no' => $this->rating_no,
            'patient_serial' => $this->patient_serial,
            'stars' => $this->stars,
            'comment' => $this->comment,
            'ticket_no' => $this->ticket_no,
            'submitted_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
