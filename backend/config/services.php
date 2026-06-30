<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Optional on-demand machine-translation provider for /documentation/translate.
    // LibreTranslate-compatible: POST { q, source, target [, api_key] }.
    // When unset, the endpoint falls back to the built-in medical phrase dictionary.
    'translation' => [
        'url' => env('TRANSLATION_API_URL'),
        'key' => env('TRANSLATION_API_KEY'),
    ],

    // Firebase Cloud Messaging — powers the watch→phone /remote/open push.
    // `credentials` is the path to the service-account JSON (Firebase Console →
    // Project settings → Service accounts → Generate new private key). When the
    // file is absent, push is skipped gracefully. `project_id` is optional — it
    // is read from the JSON unless overridden here.
    'fcm' => [
        'credentials' => env('FIREBASE_CREDENTIALS', storage_path('app/firebase/service-account.json')),
        'project_id' => env('FIREBASE_PROJECT_ID'),
    ],

];
