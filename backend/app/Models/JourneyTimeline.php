<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JourneyTimeline extends Model
{
    protected $fillable = [
        'ticket_no', 'stage', 'entered_at', 'moved_by_staff_id', 'decision_note',
    ];

    protected $casts = [
        'entered_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }

    public function movedBy(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'moved_by_staff_id', 'staff_id');
    }
}
