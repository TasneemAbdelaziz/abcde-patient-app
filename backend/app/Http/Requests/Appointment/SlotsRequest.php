<?php

namespace App\Http\Requests\Appointment;

use App\Http\Requests\ApiRequest;

class SlotsRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'dept_code' => ['required', 'string'],
            'date' => ['nullable', 'date'],
        ];
    }
}
