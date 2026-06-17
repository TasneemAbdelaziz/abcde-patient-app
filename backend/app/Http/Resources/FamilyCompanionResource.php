<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FamilyCompanionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_serial' => $this->patient_serial,
            'companion_name' => $this->companion_name,
            'relation' => $this->relation,
            'companion_phone' => $this->companion_phone,
            'can_see_status' => (bool) $this->can_see_status,
            'receives_alerts' => (bool) $this->receives_alerts,
            'can_book' => (bool) $this->can_book,
            'can_rate' => (bool) $this->can_rate,
            'can_raise_emergency' => (bool) $this->can_raise_emergency,
            'is_decision_maker' => (bool) $this->is_decision_maker,
            'is_accepted' => $this->accepted_at !== null,
            'accepted_at' => $this->accepted_at?->toDateTimeString(),
        ];
    }
}
