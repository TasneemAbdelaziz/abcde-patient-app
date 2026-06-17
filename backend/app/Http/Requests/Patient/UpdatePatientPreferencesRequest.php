<?php

namespace App\Http\Requests\Patient;

use App\Http\Requests\ApiRequest;

class UpdatePatientPreferencesRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'preferred_language' => ['nullable', 'in:ar,en,ru,zh'],
            'decision_maker' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'city_district' => ['nullable', 'string', 'max:120'],
        ];
    }
}
