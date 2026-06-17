<?php

namespace App\Http\Requests\Billing;

use App\Http\Requests\ApiRequest;

class StorePaymentRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'in:cash,card,wallet,state'],
            'reference' => ['nullable', 'string'],
        ];
    }
}
