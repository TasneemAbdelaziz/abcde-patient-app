<?php

namespace App\Http\Requests\Family;

use App\Http\Requests\ApiRequest;

class UpdateCompanionPermissionsRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'can_see_status' => ['nullable', 'boolean'],
            'receives_alerts' => ['nullable', 'boolean'],
            'can_book' => ['nullable', 'boolean'],
            'can_rate' => ['nullable', 'boolean'],
            'can_raise_emergency' => ['nullable', 'boolean'],
            'is_decision_maker' => ['nullable', 'boolean'],
        ];
    }
}
