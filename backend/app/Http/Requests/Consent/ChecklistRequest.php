<?php

namespace App\Http\Requests\Consent;

use App\Http\Requests\ApiRequest;

class ChecklistRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'record_type' => ['required', 'in:preop_checklist,surgical_timeout'],
            'item' => ['required', 'string', 'max:255'],
            'decision' => ['nullable', 'in:completed,declined'],
        ];
    }
}
