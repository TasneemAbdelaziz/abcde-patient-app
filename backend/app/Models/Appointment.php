<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    protected $primaryKey = 'appointment_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'appointment_id', 'patient_serial_or_guest', 'patient_serial', 'dept_code',
        'complaint', 'requested_at', 'scheduled_at', 'status', 'assigned_doctor_id',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'scheduled_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_serial', 'patient_serial');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'dept_code', 'dept_code');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'assigned_doctor_id', 'staff_id');
    }

    public function getIsGuestAttribute(): bool
    {
        return str_starts_with((string) $this->patient_serial_or_guest, 'guest:');
    }
}
