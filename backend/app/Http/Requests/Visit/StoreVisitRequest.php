<?php

namespace App\Http\Requests\Visit;

use App\Http\Requests\ApiRequest;

class StoreVisitRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'patient_serial' => ['required', 'string', 'exists:patients,patient_serial'],
            'arrival_type' => ['required', 'in:emergency,scheduled,cold,referred'],
            'dept_code' => ['nullable', 'string', 'exists:departments,dept_code'],
            'location_code' => ['nullable', 'string', 'exists:locations,location_code'],
        ];
    }
}
