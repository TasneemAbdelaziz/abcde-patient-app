<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\ApiRequest;

class QrLoginRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'qr_token' => ['required', 'string'],
        ];
    }
}
