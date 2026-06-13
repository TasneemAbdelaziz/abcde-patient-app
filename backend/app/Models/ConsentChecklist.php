<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsentChecklist extends Model
{
    protected $table = 'consents_checklists';

    protected $fillable = [
        'ticket_no', 'record_type', 'item', 'requested_at',
        'responded_by', 'decision', 'responded_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }
}
