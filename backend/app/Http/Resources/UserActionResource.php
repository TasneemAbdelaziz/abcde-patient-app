<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserActionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action_key' => $this->action_key,
            'label' => $this->label,
            'route' => $this->route,
            'icon' => $this->icon,
            'payload' => $this->payload,
            'position' => $this->position,
            'last_activated_at' => $this->last_activated_at?->toDateTimeString(),
            // set by the controller: is this the user's most-recently-activated action?
            'is_active' => (bool) ($this->is_active ?? false),
        ];
    }
}
