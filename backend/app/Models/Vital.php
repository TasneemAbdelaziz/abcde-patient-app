<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vital extends Model
{
    protected $fillable = [
        'ticket_no', 'taken_at', 'nurse_id', 'systolic_bp', 'diastolic_bp',
        'pulse', 'respiratory_rate', 'spo2', 'temperature', 'pain_score',
        'consciousness_avpu', 'news2_score', 'risk_level',
    ];

    protected $casts = [
        'taken_at' => 'datetime',
        'temperature' => 'decimal:1',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }

    public function nurse(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'nurse_id', 'staff_id');
    }
}
