<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarAdministration extends Model
{
    protected $fillable = [
        'ticket_no', 'prescription_id', 'drug_name', 'scheduled_time',
        'actual_time', 'administered_by', 'action', 'note',
    ];

    protected $casts = [
        'scheduled_time' => 'datetime',
        'actual_time' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class, 'prescription_id');
    }
}
