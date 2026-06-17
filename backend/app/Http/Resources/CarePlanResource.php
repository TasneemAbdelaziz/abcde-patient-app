<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CarePlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'problem_list' => $this->problem_list,
            'plan' => $this->plan,
            'outcomes' => $this->outcomes,
            'timeframe' => $this->timeframe,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
