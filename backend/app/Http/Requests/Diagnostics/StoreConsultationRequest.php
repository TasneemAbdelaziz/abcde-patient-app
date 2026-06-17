<?php

namespace App\Http\Requests\Diagnostics;

use App\Http\Requests\ApiRequest;

class StoreConsultationRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'specialty' => ['required', 'string'],
            'question' => ['required', 'string'],
        ];
    }
}
