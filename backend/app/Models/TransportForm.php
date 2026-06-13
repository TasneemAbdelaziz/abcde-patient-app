<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransportForm extends Model
{
    protected $fillable = [
        'ticket_no', 'from_location', 'to_location',
        'monitoring', 'escorted_by', 'transported_at',
    ];

    protected $casts = [
        'monitoring' => 'array',
        'transported_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }
}
