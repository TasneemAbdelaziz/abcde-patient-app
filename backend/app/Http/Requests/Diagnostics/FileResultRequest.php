<?php

namespace App\Http\Requests\Diagnostics;

use App\Http\Requests\ApiRequest;

class FileResultRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'result_summary' => ['required', 'string'],
            'status' => ['nullable', 'in:resulted,in_progress,cancelled'],
        ];
    }
}
