<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS) Configuration
|--------------------------------------------------------------------------
|
| The staff web dashboards and the patient app are static front-ends that
| call this API from a different origin (e.g. a Live Server on :5500, a
| python http.server, or file://). Because authentication is a stateless
| Sanctum Bearer token (not a cookie/session), we can safely allow any
| origin for the public API surface and expose the Authorization header.
|
*/

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Token auth (Authorization: Bearer ...) carries no cookies, so a
    // wildcard origin is safe here and keeps the front-ends portable.
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Language'],

    'max_age' => 3600,

    // Must stay false while allowed_origins is '*' (no cookies are used).
    'supports_credentials' => false,

];
