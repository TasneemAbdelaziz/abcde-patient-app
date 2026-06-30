<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Remote\RemoteOpenRequest;
use App\Models\DeviceToken;
use App\Services\FcmService;
use Illuminate\Http\JsonResponse;

/**
 * Watch → phone remote control. The watch (signed in as the same patient as the
 * phone) asks the server to open a screen on the phone; the server pushes the
 * route to every device the *same user* registered. The phone reads
 * `message.data.route` to navigate, and the accompanying `notification` lets a
 * backgrounded app be opened by tapping it.
 */
class RemoteController extends Controller
{
    public function __construct(private readonly FcmService $fcm) {}

    /**
     * POST /remote/open — fan a "open this route" push out to the user's phones.
     *
     * Response: `{ "data": { "sent_to": <delivered>, "devices": <registered> } }`.
     * When nothing is delivered, `data.reason` says *why* so a client (or a bare
     * Postman call) can tell a missing-device problem from a server FCM problem
     * without trawling the log:
     *   - `no_devices`      — this user has registered no phone (call /me/devices)
     *   - `fcm_unconfigured`— server is missing its Firebase service-account.json
     *   - `tokens_stale`    — devices existed but FCM says they're unregistered
     *                         (app reinstalled / token rotated → re-register)
     *   - `send_failed`     — tokens + FCM present, but every send errored (see log)
     */
    public function open(RemoteOpenRequest $request): JsonResponse
    {
        $user = $request->user();
        $route = $request->validated()['route'];

        $tokens = DeviceToken::where('user_id', $user->id)->pluck('fcm_token')->all();

        $result = $this->fcm->sendToTokens(
            $tokens,
            ['title' => 'Alamein', 'body' => __('Opening on your phone…')],
            ['type' => 'open', 'route' => $route],
        );

        // Drop tokens FCM reported as stale so they don't linger.
        if ($result['invalid'] !== []) {
            DeviceToken::where('user_id', $user->id)
                ->whereIn('fcm_token', $result['invalid'])
                ->delete();
        }

        $payload = ['sent_to' => $result['sent'], 'devices' => count($tokens)];

        if ($result['sent'] === 0) {
            $payload['reason'] = match (true) {
                $tokens === [] => 'no_devices',
                ! $this->fcm->isConfigured() => 'fcm_unconfigured',
                $result['invalid'] !== [] => 'tokens_stale',
                default => 'send_failed',
            };
        }

        return $this->ok($payload, 'Remote open sent.');
    }
}
