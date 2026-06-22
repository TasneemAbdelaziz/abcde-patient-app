<?php

namespace App\Http\Middleware;

use App\Services\TranslationService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Localizes the *content* of API responses into the negotiated language.
 *
 * After the controller runs, when the locale is not English, this walks the
 * response `data` and translates a whitelist of human-readable descriptive
 * fields (department names, education titles, diagnoses, specialties, hospital
 * settings, drug/lab names, etc.) via {@see TranslationService} — dictionary by
 * default, or a live MT provider when one is configured. Codes, ids, dates,
 * enums, phones, emails and proper-noun name fields are deliberately left
 * untouched, and `message`/`meta` are handled by the localizer/__() layer.
 */
class LocalizeContent
{
    /** Human-readable fields safe to translate. */
    private const FIELDS = [
        'department_name', 'description', 'title', 'condition', 'diagnosis',
        'report_summary', 'complaint_text', 'comment', 'suggestion_text',
        'patient_instructions', 'item_description', 'about', 'head_of_department',
        'specialty', 'department', 'study', 'test_name', 'drug_name', 'plan', 'problem_list',
        'outcomes', 'reason', 'note', 'decision_note', 'answer', 'disclaimer',
        'official_name', 'address', 'city', 'governorate',
        'working_hours_clinics', 'working_hours_emergency', 'relation', 'purpose',
    ];

    public function __construct(private TranslationService $translator) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $lang = app()->getLocale();
        if ($lang === 'en' || ! $response instanceof JsonResponse) {
            return $response;
        }

        $payload = $response->getData(true);
        if (! is_array($payload) || ! array_key_exists('data', $payload) || $payload['data'] === null) {
            return $response;
        }

        $payload['data'] = $this->walk($payload['data'], $lang);
        $response->setData($payload);

        return $response;
    }

    private function walk(mixed $node, string $lang): mixed
    {
        if (! is_array($node)) {
            return $node;
        }
        $out = [];
        foreach ($node as $key => $value) {
            if (is_string($value) && in_array($key, self::FIELDS, true)) {
                $out[$key] = $this->translator->localize($value, $lang);
            } elseif (is_array($value)) {
                $out[$key] = $this->walk($value, $lang);
            } else {
                $out[$key] = $value;
            }
        }

        return $out;
    }
}
