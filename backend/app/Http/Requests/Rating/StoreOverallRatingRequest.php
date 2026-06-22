<?php

namespace App\Http\Requests\Rating;

use App\Http\Requests\ApiRequest;

class StoreOverallRatingRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'stars' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'ticket_no' => ['nullable', 'string'],
        ];
    }
}
