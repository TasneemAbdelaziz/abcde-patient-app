<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'ticket_no', 'order_type', 'detail', 'status', 'ordered_by',
        'ordered_at', 'result_summary', 'resulted_at',
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
