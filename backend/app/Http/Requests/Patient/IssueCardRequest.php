<?php

namespace App\Http\Requests\Patient;

use App\Http\Requests\ApiRequest;

class IssueCardRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'card_type' => ['required', 'in:arrival,booking'],
        ];
    }
}
