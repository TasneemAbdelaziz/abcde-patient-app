<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DrugResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'drug_name' => $this->drug_name,
            'form' => $this->form,
            'strength' => $this->strength,
            'code' => $this->code,
            'currently_available' => (bool) $this->currently_available,
            'approx_stock_qty' => $this->approx_stock_qty,
            'part_of_cardiac_protocol' => (bool) $this->part_of_cardiac_protocol,
        ];
    }
}
