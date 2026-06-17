<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /** GET /notifications — current user's notifications (FR12.1.1). */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Notification::query()->latest();
        if ($user->isStaff()) {
            $query->where('user_id', $user->id);
        } else {
            $query->where(function ($q) use ($user) {
                $q->where('patient_serial', $user->patient_serial)
                    ->orWhere('user_id', $user->id);
            });
            // Family companions only get rows explicitly addressed to them.
            if ($user->role === 'family') {
                $query->where('user_id', $user->id);
            }
        }

        $items = $query->take(100)->get();

        return $this->ok([
            'unread' => $items->whereNull('read_at')->count(),
            'items' => NotificationResource::collection($items),
        ]);
    }

    /** POST /notifications/{id}/read — mark a notification read. */
    public function markRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $notification = Notification::findOrFail($id);

        $owns = $notification->user_id === $user->id
            || (! $user->isStaff() && $notification->patient_serial === $user->patient_serial);
        if (! $owns) {
            return $this->fail('Not allowed.', 403);
        }

        $notification->update(['read_at' => now()]);

        return $this->ok(new NotificationResource($notification), 'Marked as read.');
    }
}
