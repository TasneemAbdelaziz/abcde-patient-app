<?php

namespace App\Http\Requests\Committee;

use App\Http\Requests\ApiRequest;

class AuthorizeCommitteeRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'decision' => ['required', 'in:authorized,declined'],
            'memo' => ['nullable', 'string'],
        ];
    }
}
