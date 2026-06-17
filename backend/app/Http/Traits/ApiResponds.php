<?php

namespace App\Http\Traits;

use Illuminate\Http\JsonResponse;

/**
 * The standard JSON envelope shared by every API controller.
 *
 * Messages are run through the translator (JSON lang files) so they come back
 * in the negotiated locale, and every response carries a `meta.locale` hint.
 */
trait ApiResponds
{
    /**
     * Standard success envelope.
     *
     * @param  array<string,mixed>  $replace  translation placeholders
     */
    protected function ok(mixed $data = null, ?string $message = null, int $status = 200, array $replace = []): JsonResponse
    {
        $payload = ['success' => true];
        if ($message !== null) {
            $payload['message'] = __($message, $replace);
        }
        $payload['data'] = $data;
        $payload['meta'] = ['locale' => app()->getLocale()];

        return response()->json($payload, $status);
    }

    /**
     * Standard error envelope (message localized).
     *
     * @param  array<string,mixed>  $extra    extra top-level keys (e.g. `errors`)
     * @param  array<string,mixed>  $replace  translation placeholders
     */
    protected function fail(string $message, int $status = 400, array $extra = [], array $replace = []): JsonResponse
    {
        return response()->json(array_merge([
            'success' => false,
            'message' => __($message, $replace),
            'meta' => ['locale' => app()->getLocale()],
        ], $extra), $status);
    }
}
