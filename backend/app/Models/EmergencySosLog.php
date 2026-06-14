<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmergencySosLog extends Model
{
    protected $primaryKey = 'event_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'event_id', 'event_type', 'ticket_no', 'triggered_by', 'started_at',
        'physician_alerted_at', 'nursing_alerted_at', 'family_alerted_at',
        'answered_by', 'resolved_at', 'classification',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'physician_alerted_at' => 'datetime',
        'nursing_alerted_at' => 'datetime',
        'family_alerted_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }

    public function getResponseSecondsAttribute(): ?int
    {
        $first = $this->physician_alerted_at ?? $this->nursing_alerted_at;
        if (! $this->started_at || ! $first) {
            return null;
        }

        return $this->started_at->diffInSeconds($first);
    }
}
