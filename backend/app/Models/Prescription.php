<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends Model
{
    protected $fillable = [
        'ticket_no', 'prescribed_at', 'doctor_id', 'drug_name', 'dose',
        'route', 'frequency', 'duration_days', 'patient_instructions',
    ];

    protected $casts = [
        'prescribed_at' => 'datetime',
        'duration_days' => 'integer',
    ];

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'doctor_id', 'staff_id');
    }

    /** The formulary entry for this drug (matched by name), for stock/availability. */
    public function drug(): BelongsTo
    {
        return $this->belongsTo(Drug::class, 'drug_name', 'drug_name');
    }

    public function administrations(): HasMany
    {
        return $this->hasMany(MarAdministration::class, 'prescription_id');
    }
}
