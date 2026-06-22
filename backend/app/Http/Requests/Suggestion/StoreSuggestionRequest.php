<?php

namespace App\Http\Requests\Suggestion;

use App\Http\Requests\ApiRequest;

class StoreSuggestionRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'area' => ['required', 'in:patient_services,facilities,staff,waiting_time,app_tech,other'],
            'suggestion_text' => ['required', 'string', 'min:3', 'max:1000'],
            'ticket_no' => ['nullable', 'string'],
        ];
    }
}
