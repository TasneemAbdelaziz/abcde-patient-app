<?php

namespace App\Http\Requests\Consent;

use App\Http\Requests\ApiRequest;

class RespondConsentRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'decision' => ['required', 'in:given,declined'],
            'responded_by' => ['nullable', 'string', 'max:255'],
        ];
    }
}
