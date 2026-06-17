<?php

namespace App\Http\Requests\Billing;

use App\Http\Requests\ApiRequest;

class CommitteeReviewRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string'],
        ];
    }
}
