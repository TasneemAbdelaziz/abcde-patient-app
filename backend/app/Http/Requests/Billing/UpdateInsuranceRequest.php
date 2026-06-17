<?php

namespace App\Http\Requests\Billing;

use App\Http\Requests\ApiRequest;

class UpdateInsuranceRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'coverage_category' => ['required', 'in:insured,employer_paid,uninsured_able,uninsured_unable,state,pension,student'],
            'payer_name' => ['nullable', 'string'],
            'policy_no' => ['nullable', 'string'],
            'determined_from' => ['nullable', 'in:national_id,manual'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
