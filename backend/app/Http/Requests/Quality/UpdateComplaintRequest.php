<?php

namespace App\Http\Requests\Quality;

use App\Http\Requests\ApiRequest;

class UpdateComplaintRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', 'in:open,responded,escalated,closed'],
            'routed_to_dept' => ['nullable', 'string'],
        ];
    }
}
