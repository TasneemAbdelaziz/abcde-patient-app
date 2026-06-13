<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarePoint extends Model
{
    protected $fillable = [
        'patient_serial', 'points', 'reason', 'source_type', 'source_id',
    ];

    protected $casts = [
        'points' => 'integer',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_serial', 'patient_serial');
    }
}
