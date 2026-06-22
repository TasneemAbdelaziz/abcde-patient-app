<?php

namespace App\Http\Requests\UserAction;

use App\Http\Requests\ApiRequest;

class StoreUserActionRequest extends ApiRequest
{
    public function rules(): array
    {
        $req = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'label' => [$req, 'string', 'max:120'],
            'route' => [$req, 'string', 'max:200'],
            'action_key' => ['nullable', 'string', 'max:60'],
            'icon' => ['nullable', 'string', 'max:60'],
            'payload' => ['nullable', 'array'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
