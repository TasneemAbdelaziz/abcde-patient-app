<?php

namespace App\Http\Requests\Appointment;

use App\Http\Requests\ApiRequest;

class SetAppointmentStatusRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', 'in:pending,approved,declined,cancelled,completed'],
            'scheduled_at' => ['nullable', 'date'],
        ];
    }
}
