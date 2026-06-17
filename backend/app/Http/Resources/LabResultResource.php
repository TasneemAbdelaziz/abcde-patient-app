<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LabResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'test_name' => $this->test_name,
            'result_value' => $this->result_value,
            'unit' => $this->unit,
            'normal_range_low' => $this->normal_range_low,
            'normal_range_high' => $this->normal_range_high,
            'flag' => $this->flag,
            'ordered_at' => $this->ordered_at?->toDateTimeString(),
            'resulted_at' => $this->resulted_at?->toDateTimeString(),
        ];
    }
}
