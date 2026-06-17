<?php

namespace App\Http\Requests\Visit;

use App\Http\Requests\ApiRequest;

class StoreCarePlanRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'problem_list' => ['nullable', 'string'],
            'plan' => ['required', 'string'],
            'outcomes' => ['nullable', 'string'],
            'timeframe' => ['nullable', 'string'],
        ];
    }
}
