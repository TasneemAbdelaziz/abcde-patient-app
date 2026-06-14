<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedbackRating extends Model
{
    protected $fillable = [
        'ticket_no', 'stage', 'rated_by', 'stars', 'comment', 'rated_at',
    ];

    protected $casts = [
        'stars' => 'integer',
        'rated_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }
}
