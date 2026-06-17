<?php

namespace App\Http\Requests\Assistant;

use App\Http\Requests\ApiRequest;

class TriageSymptomsRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'symptoms' => ['required', 'string'],
        ];
    }
}
