<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FamilyCompanion extends Model
{
    protected $fillable = [
        'patient_serial', 'companion_name', 'relation', 'companion_phone',
        'can_see_status', 'receives_alerts', 'can_book', 'can_rate',
        'can_raise_emergency', 'is_decision_maker', 'user_id', 'accepted_at',
    ];

    protected $casts = [
        'can_see_status' => 'boolean',
        'receives_alerts' => 'boolean',
        'can_book' => 'boolean',
        'can_rate' => 'boolean',
        'can_raise_emergency' => 'boolean',
        'is_decision_maker' => 'boolean',
        'accepted_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_serial', 'patient_serial');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
