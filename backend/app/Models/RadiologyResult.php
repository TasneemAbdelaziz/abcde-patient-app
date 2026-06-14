<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RadiologyResult extends Model
{
    protected $fillable = [
        'ticket_no', 'ordered_at', 'study', 'performed_at',
        'report_summary', 'reporting_doctor',
    ];

    protected $casts = [
        'ordered_at' => 'datetime',
        'performed_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }
}
