<?php

namespace App\Http\Requests\Assistant;

use App\Http\Requests\ApiRequest;

class TranscribeRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'transcript' => ['nullable', 'string'],
        ];
    }
}
