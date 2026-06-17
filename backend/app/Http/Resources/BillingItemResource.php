<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BillingItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_no' => $this->ticket_no,
            'item_description' => $this->item_description,
            'quantity' => $this->quantity,
            'unit_price_egp' => $this->unit_price_egp,
            'line_total' => $this->line_total,
            'covered_by_insurance' => (bool) $this->covered_by_insurance,
            'payment_method' => $this->payment_method,
            'paid_at' => $this->paid_at?->toDateTimeString(),
        ];
    }
}
