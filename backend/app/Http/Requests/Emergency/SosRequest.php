<?php

namespace App\Http\Requests\Emergency;

use App\Http\Requests\ApiRequest;

class SosRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'ticket_no' => ['nullable', 'string'],
            'location' => ['nullable', 'string'],
        ];
    }
}
