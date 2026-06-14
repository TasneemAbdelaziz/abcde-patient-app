<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingItem extends Model
{
    protected $fillable = [
        'ticket_no', 'item_description', 'quantity', 'unit_price_egp',
        'covered_by_insurance', 'payment_method', 'paid_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price_egp' => 'decimal:2',
        'covered_by_insurance' => 'boolean',
        'paid_at' => 'datetime',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }

    public function getLineTotalAttribute(): float
    {
        return (float) $this->quantity * (float) $this->unit_price_egp;
    }
}
