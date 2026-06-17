<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\ApiRequest;

/**
 * The /admin/permissions route answers both GET (read the matrix) and PUT
 * (save it), so `matrix` is only required when saving.
 */
class UpdatePermissionsRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'matrix' => [$this->isMethod('PUT') ? 'required' : 'nullable', 'array'],
        ];
    }
}
