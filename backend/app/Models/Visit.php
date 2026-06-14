<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Visit extends Model
{
    protected $primaryKey = 'ticket_no';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'ticket_no', 'patient_serial', 'arrival_type', 'arrived_at',
        'triage_classification', 'dept_code', 'treating_doctor_id', 'location_code',
        'current_stage', 'door_time', 'balloon_time', 'catheterization_type',
        'visit_status',
    ];

    protected $casts = [
        'arrived_at' => 'datetime',
        'door_time' => 'datetime',
        'balloon_time' => 'datetime',
    ];

    public const STAGES = [
        'arrival', 'triage', 'diagnosis', 'cathprep', 'cath',
        'recovery', 'ward', 'discharge', 'followup',
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
        return $this->belongsTo(Staff::class, 'treating_doctor_id', 'staff_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'location_code', 'location_code');
    }

    public function timeline(): HasMany
    {
        return $this->hasMany(JourneyTimeline::class, 'ticket_no', 'ticket_no');
    }

    public function vitals(): HasMany
    {
        return $this->hasMany(Vital::class, 'ticket_no', 'ticket_no');
    }

    public function labResults(): HasMany
    {
        return $this->hasMany(LabResult::class, 'ticket_no', 'ticket_no');
    }

    public function radiologyResults(): HasMany
    {
        return $this->hasMany(RadiologyResult::class, 'ticket_no', 'ticket_no');
    }

    public function diagnoses(): HasMany
    {
        return $this->hasMany(Diagnosis::class, 'ticket_no', 'ticket_no');
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class, 'ticket_no', 'ticket_no');
    }

    public function administrations(): HasMany
    {
        return $this->hasMany(MarAdministration::class, 'ticket_no', 'ticket_no');
    }

    public function consents(): HasMany
    {
        return $this->hasMany(ConsentChecklist::class, 'ticket_no', 'ticket_no');
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(FeedbackRating::class, 'ticket_no', 'ticket_no');
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'ticket_no', 'ticket_no');
    }

    public function billingItems(): HasMany
    {
        return $this->hasMany(BillingItem::class, 'ticket_no', 'ticket_no');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'ticket_no', 'ticket_no');
    }

    public function carePlan(): HasOne
    {
        return $this->hasOne(CarePlan::class, 'ticket_no', 'ticket_no')->latestOfMany();
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class, 'ticket_no', 'ticket_no');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'ticket_no', 'ticket_no');
    }

    public function emergencyEvents(): HasMany
    {
        return $this->hasMany(EmergencySosLog::class, 'ticket_no', 'ticket_no');
    }

    /** Door-to-balloon time in minutes (cardiac KPI), or null if unavailable. */
    public function getDoorToBalloonMinutesAttribute(): ?int
    {
        if (! $this->door_time || ! $this->balloon_time) {
            return null;
        }

        return $this->door_time->diffInMinutes($this->balloon_time);
    }
}
