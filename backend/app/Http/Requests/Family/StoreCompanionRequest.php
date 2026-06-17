<?php

namespace App\Http\Requests\Family;

use App\Http\Requests\ApiRequest;

class StoreCompanionRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'companion_name' => ['required', 'string', 'max:255'],
            'relation' => ['nullable', 'in:son,daughter,spouse,parent,sibling'],
            'companion_phone' => ['nullable', 'string', 'max:30'],
            'can_see_status' => ['nullable', 'boolean'],
            'receives_alerts' => ['nullable', 'boolean'],
            'can_book' => ['nullable', 'boolean'],
            'can_rate' => ['nullable', 'boolean'],
            'can_raise_emergency' => ['nullable', 'boolean'],
            'is_decision_maker' => ['nullable', 'boolean'],
        ];
    }
}
