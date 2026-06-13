<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarePlan extends Model
{
    protected $fillable = [
        'ticket_no', 'problem_list', 'plan', 'outcomes', 'timeframe', 'created_by',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }
}
