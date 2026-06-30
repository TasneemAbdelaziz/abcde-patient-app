<?php

namespace App\Http\Requests\Device;

use App\Http\Requests\ApiRequest;
use Illuminate\Validation\Rule;

/**
 * POST /me/devices — the phone registers its FCM token. `platform` is optional
 * (defaults to whatever the client knows); only `fcm_token` is required.
 */
class RegisterDeviceRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'fcm_token' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', Rule::in(['android', 'ios', 'web'])],
        ];
    }
}
