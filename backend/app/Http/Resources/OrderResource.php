<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'order_type' => $this->order_type,
            'detail' => $this->detail,
            'status' => $this->status,
            'ordered_by' => $this->ordered_by,
            'ordered_at' => $this->ordered_at?->toDateTimeString(),
            'result_summary' => $this->result_summary,
            'resulted_at' => $this->resulted_at?->toDateTimeString(),
        ];
    }
}
