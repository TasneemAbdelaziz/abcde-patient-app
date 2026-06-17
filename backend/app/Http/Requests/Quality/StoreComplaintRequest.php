<?php

namespace App\Http\Requests\Quality;

use App\Http\Requests\ApiRequest;

class StoreComplaintRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'ticket_no' => ['nullable', 'string'],
            'stage' => ['nullable', 'string'],
            'complaint_text' => ['required', 'string'],
            'routed_to_dept' => ['nullable', 'string'],
        ];
    }
}
