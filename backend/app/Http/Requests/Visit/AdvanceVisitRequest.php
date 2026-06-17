<?php

namespace App\Http\Requests\Visit;

use App\Http\Requests\ApiRequest;
use App\Models\Visit;

class AdvanceVisitRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'stage' => ['nullable', 'in:' . implode(',', Visit::STAGES)],
            'note' => ['nullable', 'string'],
            'location_code' => ['nullable', 'string', 'exists:locations,location_code'],
            'balloon_time' => ['nullable', 'date'],
        ];
    }
}
