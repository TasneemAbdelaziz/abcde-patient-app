<?php

namespace App\Http\Requests\Diagnostics;

use App\Http\Requests\ApiRequest;

class StoreOrderRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'order_type' => ['required', 'in:lab,radiology,medication,diet,imaging'],
            'detail' => ['required', 'string'],
        ];
    }
}
