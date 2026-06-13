<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'patient_serial', 'user_id', 'type', 'title', 'body', 'data', 'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_serial', 'patient_serial');
    }

    public function getIsReadAttribute(): bool
    {
        return $this->read_at !== null;
    }
}
