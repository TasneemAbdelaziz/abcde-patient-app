<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Firebase Cloud Messaging sender (FCM HTTP v1).
 *
 * Self-contained — no Firebase SDK dependency. It mints a short-lived OAuth2
 * access token from the service-account JSON (signing a JWT with the account's
 * RS256 private key), caches it for its lifetime, and posts messages to the v1
 * endpoint. Drop the service account file at
 * `storage/app/firebase/service-account.json` (Firebase Console → Project
 * settings → Service accounts → Generate new private key), or point
 * `FIREBASE_CREDENTIALS` at it. When credentials are absent the sender degrades
 * gracefully — it logs and reports zero sends so the API still responds.
 *
 * @see https://firebase.google.com/docs/cloud-messaging/auth-server
 * @see https://firebase.google.com/docs/cloud-messaging/send-message
 */
class FcmService
{
    private const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

    private const CACHE_KEY = 'fcm.access_token';

    private const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';

    /** Decoded service-account credentials, or null when not configured. */
    private ?array $sa = null;

    public function __construct()
    {
        $path = config('services.fcm.credentials');
        if ($path && is_file($path) && is_readable($path)) {
            $json = json_decode((string) file_get_contents($path), true);
            if (is_array($json) && isset($json['client_email'], $json['private_key'])) {
                $this->sa = $json;
            }
        }
    }

    /** Whether usable FCM credentials (account + project id) are present. */
    public function isConfigured(): bool
    {
        return $this->sa !== null && $this->projectId() !== null;
    }

    /**
     * Send one notification + data payload to many device tokens.
     *
     * @param  string[]  $tokens
     * @param  array{title:string,body:string}  $notification
     * @param  array<string,mixed>  $data  coerced to strings (FCM requires string data values)
     * @return array{sent:int,invalid:string[]} invalid = tokens FCM rejected as stale/unregistered
     */
    public function sendToTokens(array $tokens, array $notification, array $data): array
    {
        $tokens = array_values(array_unique(array_filter($tokens)));

        if (! $this->isConfigured()) {
            Log::warning('FCM not configured; push skipped.', ['devices' => count($tokens)]);

            return ['sent' => 0, 'invalid' => []];
        }

        if ($tokens === []) {
            return ['sent' => 0, 'invalid' => []];
        }

        $access = $this->accessToken();
        if ($access === null) {
            return ['sent' => 0, 'invalid' => []];
        }

        $data = array_map(static fn ($v) => (string) $v, $data);
        $sent = 0;
        $invalid = [];

        foreach ($tokens as $token) {
            $result = $this->sendOne($access, $token, $notification, $data);
            if ($result === 'sent') {
                $sent++;
            } elseif ($result === 'invalid') {
                $invalid[] = $token;
            }
        }

        return ['sent' => $sent, 'invalid' => $invalid];
    }

    /**
     * Deliver a single message.
     *
     * @return string one of 'sent', 'invalid', 'error'
     */
    private function sendOne(string $access, string $token, array $notification, array $data): string
    {
        $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId()}/messages:send";

        $response = Http::withToken($access)->acceptJson()->post($url, [
            'message' => [
                'token' => $token,
                'notification' => $notification,
                'data' => $data,
                'android' => ['priority' => 'high'],
            ],
        ]);

        if ($response->successful()) {
            return 'sent';
        }

        // A stale token comes back as 404 UNREGISTERED (or 400 INVALID_ARGUMENT);
        // the caller prunes these so they aren't retried forever.
        $status = (string) $response->json('error.status');
        if ($response->status() === 404 || in_array($status, ['UNREGISTERED', 'INVALID_ARGUMENT'], true)) {
            return 'invalid';
        }

        Log::warning('FCM send failed.', ['http' => $response->status(), 'body' => $response->json()]);

        return 'error';
    }

    /** OAuth2 bearer for the messaging scope, cached until shortly before expiry. */
    private function accessToken(): ?string
    {
        $cached = Cache::get(self::CACHE_KEY);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $jwt = $this->makeAssertion();
        if ($jwt === null) {
            return null;
        }

        $response = Http::asForm()->post($this->sa['token_uri'] ?? self::DEFAULT_TOKEN_URI, [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if (! $response->successful()) {
            Log::error('FCM OAuth token request failed.', ['body' => $response->json()]);

            return null;
        }

        $access = $response->json('access_token');
        if (! is_string($access) || $access === '') {
            return null;
        }

        $ttl = (int) ($response->json('expires_in') ?? 3600);
        Cache::put(self::CACHE_KEY, $access, max(60, $ttl - 60));

        return $access;
    }

    /** Build the RS256-signed JWT bearer assertion from the service account. */
    private function makeAssertion(): ?string
    {
        $now = time();
        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $claims = [
            'iss' => $this->sa['client_email'],
            'scope' => self::SCOPE,
            'aud' => $this->sa['token_uri'] ?? self::DEFAULT_TOKEN_URI,
            'iat' => $now,
            'exp' => $now + 3600,
        ];

        $input = $this->base64url((string) json_encode($header))
            .'.'.$this->base64url((string) json_encode($claims));

        $signature = '';
        if (! openssl_sign($input, $signature, $this->sa['private_key'], OPENSSL_ALGO_SHA256)) {
            Log::error('FCM JWT signing failed (check service-account private_key).');

            return null;
        }

        return $input.'.'.$this->base64url($signature);
    }

    private function base64url(string $binary): string
    {
        return rtrim(strtr(base64_encode($binary), '+/', '-_'), '=');
    }

    /** Project id — explicit config wins, else read from the service account. */
    private function projectId(): ?string
    {
        return config('services.fcm.project_id') ?: ($this->sa['project_id'] ?? null);
    }
}
