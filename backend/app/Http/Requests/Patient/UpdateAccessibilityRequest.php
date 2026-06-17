<?php

namespace App\Http\Requests\Patient;

use App\Http\Requests\ApiRequest;

class UpdateAccessibilityRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'high_contrast' => ['nullable', 'boolean'],
            'screen_reader' => ['nullable', 'boolean'],
            'text_to_speech' => ['nullable', 'boolean'],
            'captions' => ['nullable', 'boolean'],
            'haptics' => ['nullable', 'boolean'],
            'simple_mode' => ['nullable', 'boolean'],
            'font_scale' => ['nullable', 'numeric', 'between:0.8,3'],
            'extra' => ['nullable', 'array'],
        ];
    }
}
