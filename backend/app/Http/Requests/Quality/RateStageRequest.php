<?php

namespace App\Http\Requests\Quality;

use App\Http\Requests\ApiRequest;

class RateStageRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'stars' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string'],
        ];
    }
}
