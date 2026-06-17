<?php

namespace App\Http\Requests\Emergency;

use App\Http\Requests\ApiRequest;

class AnswerEmergencyRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'answered_by' => ['nullable', 'string'],
            'classification' => ['nullable', 'in:real_emergency,heads_up'],
            'resolve' => ['nullable', 'boolean'],
        ];
    }
}
