<?php

namespace App\Http\Requests\Appointment;

use App\Http\Requests\ApiRequest;

class RescheduleAppointmentRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'scheduled_at' => ['required', 'date'],
        ];
    }
}
