<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabResult extends Model
{
    protected $fillable = [
        'ticket_no', 'ordered_at', 'test_name', 'result_value', 'unit',
        'normal_range_low', 'normal_range_high', 'flag', 'resulted_at',
    ];

    protected $casts = [
        'ordered_at' => 'datetime',
        'resulted_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }
}
