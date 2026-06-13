<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InsuranceCoverage extends Model
{
    protected $fillable = [
        'patient_serial', 'coverage_category', 'payer_name',
        'policy_no', 'determined_from', 'notes',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_serial', 'patient_serial');
    }
}
