<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientCard extends Model
{
    protected $fillable = [
        'patient_serial', 'card_type', 'barcode', 'qr_token', 'issued_by', 'issued_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
    ];

    protected $hidden = ['qr_token'];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_serial', 'patient_serial');
    }
}
