<?php

namespace App\Http\Requests\Emergency;

use App\Http\Requests\ApiRequest;

class AdvanceEmergencyRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'step' => ['required', 'in:physician,nursing,family,resolved'],
        ];
    }
}
