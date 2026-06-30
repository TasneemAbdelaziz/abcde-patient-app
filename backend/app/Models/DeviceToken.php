<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A phone's FCM registration token, owned by a user. Created/updated via
 * POST /me/devices and consumed by POST /remote/open to deliver a "open this
 * screen" push to all of the owner's devices.
 */
class DeviceToken extends Model
{
    protected $fillable = [
        'user_id',
        'fcm_token',
        'platform',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
