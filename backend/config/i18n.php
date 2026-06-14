<?php

return [
    /*
     | Locales the API will negotiate and serve. The mobile apps and web
     | dashboards select one of these via ?lang=, the X-Locale header, or the
     | standard Accept-Language header; an authenticated user's saved locale is
     | used as a fallback. Anything else falls back to APP_LOCALE.
     */
    'supported' => ['en', 'ar', 'ru', 'zh'],

    // Right-to-left locales (handy for clients rendering the response).
    'rtl' => ['ar'],

    'names' => [
        'en' => 'English',
        'ar' => 'العربية',
        'ru' => 'Русский',
        'zh' => '中文',
    ],
];
