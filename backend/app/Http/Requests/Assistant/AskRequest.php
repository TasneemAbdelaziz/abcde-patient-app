<?php

namespace App\Http\Requests\Assistant;

use App\Http\Requests\ApiRequest;

class AskRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'question' => ['required', 'string'],
            'context' => ['nullable', 'string'],
        ];
    }
}
