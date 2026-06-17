<?php

namespace App\Http\Requests\Consent;

use App\Http\Requests\ApiRequest;

class StoreConsentRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'item' => ['required', 'string', 'max:255'],
        ];
    }
}
