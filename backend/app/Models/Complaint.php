<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Complaint extends Model
{
    protected $primaryKey = 'complaint_no';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'complaint_no', 'ticket_no', 'submitted_at', 'stage',
        'complaint_text', 'routed_to_dept', 'responded_at', 'status',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }

    /** Whether the complaint was answered within the 6-hour SLA. */
    public function getAnsweredWithinSlaAttribute(): ?bool
    {
        if (! $this->submitted_at || ! $this->responded_at) {
            return null;
        }

        return $this->submitted_at->diffInHours($this->responded_at) <= 6;
    }
}
