<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * Per-request locale negotiation for the multilingual API (en, ar, ru, zh).
 *
 * Resolution order (first supported match wins):
 *   1. ?lang= query parameter
 *   2. X-Locale request header
 *   3. Accept-Language request header (e.g. "zh-CN,zh;q=0.9,en;q=0.8")
 *   4. The authenticated user's saved locale
 *   5. APP_LOCALE default
 *
 * The chosen locale is echoed back in the Content-Language response header.
 */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $supported = config('i18n.supported', ['en']);
        $locale = $this->negotiate($request, $supported) ?? config('app.locale');

        App::setLocale($locale);

        $response = $next($request);
        $response->headers->set('Content-Language', $locale);

        return $response;
    }

    private function negotiate(Request $request, array $supported): ?string
    {
        $candidates = [
            $request->query('lang'),
            $request->header('X-Locale'),
        ];

        // Parse Accept-Language, honouring quality weights and stripping regions.
        foreach ($this->parseAcceptLanguage($request->header('Accept-Language')) as $tag) {
            $candidates[] = $tag;
        }

        $candidates[] = $request->user()?->locale;

        foreach ($candidates as $candidate) {
            if (! $candidate) {
                continue;
            }
            $base = strtolower(substr((string) $candidate, 0, 2));
            if (in_array($base, $supported, true)) {
                return $base;
            }
        }

        return null;
    }

    /** @return array<int,string> language tags ordered by descending quality */
    private function parseAcceptLanguage(?string $header): array
    {
        if (! $header) {
            return [];
        }

        $tags = [];
        foreach (explode(',', $header) as $part) {
            $bits = explode(';q=', trim($part));
            $tag = trim($bits[0]);
            $q = isset($bits[1]) ? (float) $bits[1] : 1.0;
            if ($tag !== '') {
                $tags[] = ['tag' => $tag, 'q' => $q];
            }
        }
        usort($tags, fn ($a, $b) => $b['q'] <=> $a['q']);

        return array_map(fn ($t) => $t['tag'], $tags);
    }
}
