<?php

namespace App\Http\Requests\Visit;

use App\Http\Requests\ApiRequest;

class CathTypeRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'catheterization_type' => ['required', 'in:cerebral,cardiac,peripheral,interventional_radiology'],
        ];
    }
}
