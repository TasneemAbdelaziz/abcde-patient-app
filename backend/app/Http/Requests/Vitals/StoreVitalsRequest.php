<?php

namespace App\Http\Requests\Vitals;

use App\Http\Requests\ApiRequest;

class StoreVitalsRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'systolic_bp' => ['nullable', 'integer', 'between:40,300'],
            'diastolic_bp' => ['nullable', 'integer', 'between:20,200'],
            'pulse' => ['nullable', 'integer', 'between:20,260'],
            'respiratory_rate' => ['nullable', 'integer', 'between:4,60'],
            'spo2' => ['nullable', 'integer', 'between:50,100'],
            'temperature' => ['nullable', 'numeric', 'between:30,45'],
            'pain_score' => ['nullable', 'integer', 'between:0,10'],
            'consciousness_avpu' => ['nullable', 'in:A,V,P,U'],
            'taken_at' => ['nullable', 'date'],
        ];
    }
}
