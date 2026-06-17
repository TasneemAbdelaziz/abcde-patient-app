<?php

namespace App\Http\Requests\Assistant;

use App\Http\Requests\ApiRequest;

class TranslateRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'text' => ['required', 'string'],
            'target' => ['required', 'in:ar,en,ru,zh'],
        ];
    }
}
