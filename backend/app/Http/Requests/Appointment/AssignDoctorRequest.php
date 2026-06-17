<?php

namespace App\Http\Requests\Appointment;

use App\Http\Requests\ApiRequest;

class AssignDoctorRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'assigned_doctor_id' => ['required', 'string', 'exists:staff,staff_id'],
        ];
    }
}
