<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\ApiRequest;
use App\Models\User;
use Illuminate\Validation\Rule;

class StoreUserRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'unique:users,email'],
            'username' => ['required', 'string', 'unique:users,username'],
            'role' => ['required', Rule::in(User::ROLES)],
            'staff_id' => ['nullable', 'string'],
            'password' => ['required', 'string', 'min:6'],
            'locale' => ['nullable', 'in:ar,en,ru,zh'],
        ];
    }
}
