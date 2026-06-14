<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommitteeReview extends Model
{
    protected $fillable = [
        'ticket_no', 'review_type', 'reason', 'members',
        'decision', 'memo', 'decided_by', 'decided_at',
    ];

    protected $casts = [
        'members' => 'array',
        'decided_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }
}
