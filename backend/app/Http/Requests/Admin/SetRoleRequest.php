<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\ApiRequest;
use App\Models\User;
use Illuminate\Validation\Rule;

class SetRoleRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'role' => ['required', Rule::in(User::ROLES)],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
