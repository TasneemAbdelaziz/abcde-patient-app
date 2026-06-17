<?php

namespace App\Http\Requests\Vitals;

use App\Http\Requests\ApiRequest;

class ThresholdsRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'systolic_bp_min' => ['nullable', 'integer'],
            'systolic_bp_max' => ['nullable', 'integer'],
            'pulse_min' => ['nullable', 'integer'],
            'pulse_max' => ['nullable', 'integer'],
            'spo2_min' => ['nullable', 'integer'],
        ];
    }
}
