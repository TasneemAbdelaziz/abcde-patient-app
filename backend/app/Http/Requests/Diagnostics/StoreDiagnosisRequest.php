<?php

namespace App\Http\Requests\Diagnostics;

use App\Http\Requests\ApiRequest;

class StoreDiagnosisRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'icd10_code' => ['nullable', 'string', 'max:20'],
            'diagnosis' => ['required', 'string'],
            'is_primary' => ['nullable', 'boolean'],
        ];
    }
}
