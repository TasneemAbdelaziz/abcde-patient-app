<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Patient extends Model
{
    protected $primaryKey = 'patient_serial';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'patient_serial', 'national_id', 'full_name', 'date_of_birth', 'gender',
        'phone', 'city_district', 'preferred_language', 'decision_maker',
        'chronic_conditions', 'user_id',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function insurance(): HasOne
    {
        return $this->hasOne(InsuranceCoverage::class, 'patient_serial', 'patient_serial');
    }

    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class, 'patient_serial', 'patient_serial');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'patient_serial', 'patient_serial');
    }

    public function companion(): HasOne
    {
        return $this->hasOne(FamilyCompanion::class, 'patient_serial', 'patient_serial');
    }

    public function carePoints(): HasMany
    {
        return $this->hasMany(CarePoint::class, 'patient_serial', 'patient_serial');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'patient_serial', 'patient_serial');
    }

    public function accessibility(): HasOne
    {
        return $this->hasOne(AccessibilitySetting::class, 'patient_serial', 'patient_serial');
    }

    public function cards(): HasMany
    {
        return $this->hasMany(PatientCard::class, 'patient_serial', 'patient_serial');
    }

    public function getCarePointsTotalAttribute(): int
    {
        return (int) $this->carePoints()->sum('points');
    }
}
