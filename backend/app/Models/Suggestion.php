<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Suggestion extends Model
{
    protected $primaryKey = 'suggestion_no';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'suggestion_no', 'patient_serial', 'area', 'suggestion_text',
        'ticket_no', 'status', 'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_serial', 'patient_serial');
    }

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'ticket_no', 'ticket_no');
    }
}
