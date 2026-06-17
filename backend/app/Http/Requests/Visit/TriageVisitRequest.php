<?php

namespace App\Http\Requests\Visit;

use App\Http\Requests\ApiRequest;

class TriageVisitRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'triage_classification' => ['required', 'in:cold,emergency,critical'],
            'dept_code' => ['nullable', 'string', 'exists:departments,dept_code'],
            'location_code' => ['nullable', 'string', 'exists:locations,location_code'],
            'note' => ['nullable', 'string'],
        ];
    }
}
