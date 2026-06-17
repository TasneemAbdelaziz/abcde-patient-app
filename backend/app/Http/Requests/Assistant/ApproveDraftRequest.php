<?php

namespace App\Http\Requests\Assistant;

use App\Http\Requests\ApiRequest;

class ApproveDraftRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'content' => ['nullable', 'string'],
        ];
    }
}
