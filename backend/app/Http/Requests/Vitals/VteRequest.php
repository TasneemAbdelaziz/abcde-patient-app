<?php

namespace App\Http\Requests\Vitals;

use App\Http\Requests\ApiRequest;

class VteRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'factors' => ['required', 'array', 'min:1'],
            'factors.*.factor' => ['required', 'string'],
            'factors.*.points' => ['required', 'integer', 'min:0', 'max:3'],
        ];
    }
}
