<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

class RegisterPatientRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            // The Serial is built from the national ID and reused across visits, so a
            // national ID that already exists is rejected — nobody gets a second Serial (FR-1.4).
            'national_id' => ['nullable', 'string', 'max:20', Rule::unique('patients', 'national_id')],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'in:M,F'],
            // A patient User's username is their phone, so the phone must be unique.
            'phone' => ['required', 'string', 'max:30', Rule::unique('users', 'username')],
            'city_district' => ['nullable', 'string', 'max:120'],
            'preferred_language' => ['nullable', 'in:ar,en,ru,zh'],
            'decision_maker' => ['nullable', 'string', 'max:255'],
            'chronic_conditions' => ['nullable', 'string'],
            'password' => ['nullable', 'string', 'min:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.unique' => __('An account with this phone number already exists.'),
            'national_id.unique' => __('A patient with this national ID already exists.'),
        ];
    }
}
