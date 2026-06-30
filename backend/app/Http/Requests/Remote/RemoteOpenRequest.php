<?php

namespace App\Http\Requests\Remote;

use App\Http\Requests\ApiRequest;

/**
 * POST /remote/open — the watch asks the server to open an app screen on the
 * user's phone(s). `route` is the in-app route/deep-link the phone navigates to.
 */
class RemoteOpenRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'route' => ['required', 'string', 'max:200'],
        ];
    }
}
