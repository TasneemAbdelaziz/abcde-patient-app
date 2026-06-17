<?php

namespace App\Http\Requests\Assistant;

use App\Http\Requests\ApiRequest;

class DraftRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'ticket_no' => ['nullable', 'string'],
            'doc_type' => ['required', 'in:discharge_summary,report,note'],
        ];
    }
}
