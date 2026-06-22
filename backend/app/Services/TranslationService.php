<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * On-demand translation for arbitrary/dynamic text (medication instructions,
 * diagnosis notes, etc.) used by POST /documentation/translate.
 *
 * Resolution order:
 *   1. If an external MT provider is configured (config services.translation),
 *      call it (LibreTranslate-compatible: q/source/target[/api_key]).
 *   2. Otherwise use a curated medical-phrase dictionary (ar/ru/zh) that
 *      covers the app's known clinical strings.
 *   3. Fall back to the source text (flagged) when nothing matches.
 *
 * Source language is assumed to be English (the app translates English content).
 */
class TranslationService
{
    /** English phrase (normalized) → per-language translation. */
    private const DICT = [
        'ar' => [
            'take one tablet daily after food' => 'تناول قرصًا واحدًا يوميًا بعد الطعام',
            'take one tablet twice daily after food' => 'تناول قرصًا واحدًا مرتين يوميًا بعد الطعام',
            'one tablet daily after food' => 'قرص واحد يوميًا بعد الطعام',
            'one tablet daily' => 'قرص واحد يوميًا',
            'two tablets daily' => 'قرصان يوميًا',
            'once daily' => 'مرة واحدة يوميًا',
            'twice daily' => 'مرتين يوميًا',
            'three times daily' => 'ثلاث مرات يوميًا',
            'take at night' => 'يؤخذ في الليل',
            'take in the morning' => 'يؤخذ في الصباح',
            'take with water' => 'يؤخذ مع الماء',
            'before food' => 'قبل الطعام',
            'after food' => 'بعد الطعام',
            'do not stop without consulting your doctor' => 'لا توقف الدواء دون استشارة طبيبك',
            'rest and avoid exertion for two weeks' => 'الراحة وتجنّب المجهود لمدة أسبوعين',
            'come back if you feel chest pain' => 'عُد إلى المستشفى إذا شعرت بألم في الصدر',
            'drink plenty of fluids' => 'اشرب كميات وفيرة من السوائل',
            'follow up with your cardiologist' => 'تابع مع طبيب القلب',
            'essential (primary) hypertension' => 'ارتفاع ضغط الدم الأساسي (الأولي)',
            'type 2 diabetes mellitus' => 'داء السكري من النوع الثاني',
        ],
        'ru' => [
            'take one tablet daily after food' => 'Принимайте одну таблетку в день после еды',
            'take one tablet twice daily after food' => 'Принимайте одну таблетку дважды в день после еды',
            'one tablet daily after food' => 'Одна таблетка в день после еды',
            'one tablet daily' => 'Одна таблетка в день',
            'two tablets daily' => 'Две таблетки в день',
            'once daily' => 'Один раз в день',
            'twice daily' => 'Дважды в день',
            'three times daily' => 'Три раза в день',
            'take at night' => 'Принимать на ночь',
            'take in the morning' => 'Принимать утром',
            'take with water' => 'Запивать водой',
            'before food' => 'До еды',
            'after food' => 'После еды',
            'do not stop without consulting your doctor' => 'Не прекращайте приём без консультации с врачом',
            'rest and avoid exertion for two weeks' => 'Отдыхайте и избегайте нагрузок в течение двух недель',
            'come back if you feel chest pain' => 'Вернитесь, если почувствуете боль в груди',
            'drink plenty of fluids' => 'Пейте больше жидкости',
            'follow up with your cardiologist' => 'Наблюдайтесь у кардиолога',
            'essential (primary) hypertension' => 'Эссенциальная (первичная) гипертензия',
            'type 2 diabetes mellitus' => 'Сахарный диабет 2 типа',
        ],
        'zh' => [
            'take one tablet daily after food' => '每日饭后服用一片',
            'take one tablet twice daily after food' => '每日饭后服用一片，每日两次',
            'one tablet daily after food' => '每日饭后一片',
            'one tablet daily' => '每日一片',
            'two tablets daily' => '每日两片',
            'once daily' => '每日一次',
            'twice daily' => '每日两次',
            'three times daily' => '每日三次',
            'take at night' => '夜间服用',
            'take in the morning' => '早晨服用',
            'take with water' => '用水送服',
            'before food' => '饭前',
            'after food' => '饭后',
            'do not stop without consulting your doctor' => '未经医生同意请勿停药',
            'rest and avoid exertion for two weeks' => '休息并在两周内避免劳累',
            'come back if you feel chest pain' => '如感到胸痛请立即返院',
            'drink plenty of fluids' => '多喝水',
            'follow up with your cardiologist' => '请到心脏科复诊',
            'essential (primary) hypertension' => '原发性高血压',
            'type 2 diabetes mellitus' => '2型糖尿病',
        ],
    ];

    /**
     * @return array{translated_text:string, provider:string, translated:bool}
     */
    public function translate(string $text, string $target): array
    {
        $clean = trim($text);
        if ($clean === '' || $target === 'en') {
            return ['translated_text' => $text, 'provider' => 'none', 'translated' => true];
        }

        // 1) external provider, if configured
        $provider = $this->viaProvider($clean, $target);
        if ($provider !== null) {
            return ['translated_text' => $provider, 'provider' => 'mt-provider', 'translated' => true];
        }

        // 2) curated medical dictionary
        $key = $this->normalize($clean);
        $hit = self::DICT[$target][$key] ?? null;
        if ($hit !== null) {
            // preserve a trailing period if the source had one
            if (str_ends_with($clean, '.') && ! str_ends_with($hit, '.') && $target !== 'zh') {
                $hit .= '.';
            }
            return ['translated_text' => $hit, 'provider' => 'dictionary', 'translated' => true];
        }

        // 3) no match — return source, flagged
        return ['translated_text' => $text, 'provider' => 'none', 'translated' => false];
    }

    private function normalize(string $s): string
    {
        $s = mb_strtolower(trim($s));
        $s = preg_replace('/\s+/u', ' ', $s);
        return rtrim($s, " .。!！؟?");
    }

    private function viaProvider(string $text, string $target): ?string
    {
        $url = config('services.translation.url');
        if (! $url) {
            return null;
        }
        try {
            $payload = ['q' => $text, 'source' => 'en', 'target' => $target, 'format' => 'text'];
            if ($key = config('services.translation.key')) {
                $payload['api_key'] = $key;
            }
            $res = Http::timeout(8)->asJson()->post($url, $payload);
            if ($res->successful()) {
                // LibreTranslate-style: { "translatedText": "..." }
                $out = $res->json('translatedText') ?? $res->json('data.translations.0.translatedText');
                return is_string($out) && $out !== '' ? $out : null;
            }
        } catch (\Throwable $e) {
            // fall through to the dictionary
        }

        return null;
    }
}
