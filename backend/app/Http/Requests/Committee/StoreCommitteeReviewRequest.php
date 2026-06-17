<?php

namespace App\Http\Requests\Committee;

use App\Http\Requests\ApiRequest;

class StoreCommitteeReviewRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'review_type' => ['required', 'in:funding,direct_admission'],
            'reason' => ['required', 'string'],
            'members' => ['nullable', 'array'],
            'members.*' => ['string'],
        ];
    }
}
