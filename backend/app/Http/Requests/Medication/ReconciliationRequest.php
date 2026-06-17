<?php

namespace App\Http\Requests\Medication;

use App\Http\Requests\ApiRequest;

class ReconciliationRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'home_medications' => ['nullable', 'array'],
            'home_medications.*' => ['string'],
            'note' => ['nullable', 'string'],
        ];
    }
}
