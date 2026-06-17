<?php

namespace App\Http\Requests\Medication;

use App\Http\Requests\ApiRequest;

class StorePrescriptionRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'drug_name' => ['required', 'string'],
            'dose' => ['nullable', 'string'],
            'route' => ['nullable', 'in:PO,IV,SC,IM'],
            'frequency' => ['nullable', 'string'],
            'duration_days' => ['nullable', 'integer', 'min:1'],
            'patient_instructions' => ['nullable', 'string'],
        ];
    }
}
