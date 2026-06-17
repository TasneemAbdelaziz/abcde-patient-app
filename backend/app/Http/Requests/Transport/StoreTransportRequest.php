<?php

namespace App\Http\Requests\Transport;

use App\Http\Requests\ApiRequest;

class StoreTransportRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'from_location' => ['required', 'string'],
            'to_location' => ['required', 'string'],
            'monitoring' => ['nullable', 'array'],
        ];
    }
}
