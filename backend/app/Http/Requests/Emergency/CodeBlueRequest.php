<?php

namespace App\Http\Requests\Emergency;

use App\Http\Requests\ApiRequest;

class CodeBlueRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'ticket_no' => ['nullable', 'string'],
            'location' => ['required', 'string'],
        ];
    }
}
