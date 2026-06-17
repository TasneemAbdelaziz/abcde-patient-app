<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'amount' => $this->amount,
            'method' => $this->method,
            'status' => $this->status,
            'reference' => $this->reference,
            'paid_at' => $this->paid_at?->toDateTimeString(),
        ];
    }
}
