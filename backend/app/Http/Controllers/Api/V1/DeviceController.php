<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Device\RegisterDeviceRequest;
use App\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Push-device registration. The phone registers its FCM token after login so
 * the watch can later wake a screen on it (see {@see RemoteController}). All
 * tokens are scoped to the authenticated user resolved from the Bearer token —
 * that shared user id is what links a person's watch and phone together.
 */
class DeviceController extends Controller
{
    /**
     * POST /me/devices — register (upsert) this phone's FCM token for the user.
     *
     * Upsert is keyed on the token: re-registering the same token just re-points
     * it at the current user (and refreshes the platform), never duplicating.
     */
    public function store(RegisterDeviceRequest $request): JsonResponse
    {
        $data = $request->validated();

        DeviceToken::updateOrCreate(
            ['fcm_token' => $data['fcm_token']],
            ['user_id' => $request->user()->id, 'platform' => $data['platform'] ?? null],
        );

        return $this->ok(['registered' => true], 'Device registered.');
    }

    /**
     * DELETE /me/devices — unregister a token on logout (optional cleanup).
     *
     * With `fcm_token` in the body, removes just that device; without it, removes
     * all of the user's devices. Scoped to the user, so one user can never delete
     * another's token.
     */
    public function destroy(Request $request): JsonResponse
    {
        $query = DeviceToken::where('user_id', $request->user()->id);

        if ($request->filled('fcm_token')) {
            $query->where('fcm_token', $request->input('fcm_token'));
        }

        $removed = $query->delete();

        return $this->ok(['removed' => $removed], 'Device removed.');
    }
}
