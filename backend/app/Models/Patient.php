<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

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

    /** Issues the next sequential patient serial (e.g. "ALM-20501"). */
    public static function nextSerial(): string
    {
        $last = static::where('patient_serial', 'like', 'ALM-%')
            ->orderByDesc('patient_serial')
            ->value('patient_serial');
        $n = $last ? (int) Str::after($last, 'ALM-') : 20500;

        return 'ALM-' . ($n + 1);
    }
}
