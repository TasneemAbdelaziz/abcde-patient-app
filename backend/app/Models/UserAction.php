<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAction extends Model
{
    // microsecond precision so rapid activations order correctly ("last active")
    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected $fillable = [
        'user_id', 'action_key', 'label', 'route', 'icon', 'payload',
        'position', 'last_activated_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'position' => 'integer',
        'last_activated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
