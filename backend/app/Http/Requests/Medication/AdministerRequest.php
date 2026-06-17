<?php

namespace App\Http\Requests\Medication;

use App\Http\Requests\ApiRequest;

class AdministerRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'action' => ['required', 'in:given,refused,missed,taken'],
            'scheduled_time' => ['nullable', 'date'],
            'actual_time' => ['nullable', 'date'],
            'note' => ['nullable', 'string'],
        ];
    }
}
