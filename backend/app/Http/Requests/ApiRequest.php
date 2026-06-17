<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Base for all API form requests. Authorization is enforced by route
 * middleware (`auth:sanctum` + `role:`), so requests authorize by default and
 * only declare validation `rules()`. Validation failures fall through to
 * Laravel's JSON 422 response, matching the previous inline behaviour.
 */
abstract class ApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
}
