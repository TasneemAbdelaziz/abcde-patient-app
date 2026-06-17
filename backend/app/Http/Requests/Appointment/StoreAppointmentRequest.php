<?php

namespace App\Http\Requests\Appointment;

use App\Http\Requests\ApiRequest;

class StoreAppointmentRequest extends ApiRequest
{
    public function rules(): array
    {
        // Guests (no authenticated patient) must supply name + phone.
        $guestRule = $this->user()?->patient_serial ? 'nullable' : 'required';

        return [
            'dept_code' => ['required', 'string', 'exists:departments,dept_code'],
            'complaint' => ['nullable', 'string', 'max:1000'],
            'requested_at' => ['nullable', 'date'],
            'guest_name' => [$guestRule, 'string', 'max:255'],
            'guest_phone' => [$guestRule, 'string', 'max:30'],
        ];
    }
}
