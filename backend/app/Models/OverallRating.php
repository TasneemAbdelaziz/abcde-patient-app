<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OverallRating extends Model
{
    protected $primaryKey = 'rating_no';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'rating_no', 'patient_serial', 'stars', 'comment', 'ticket_no',
    ];

    protected $casts = [
        'stars' => 'integer',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_serial', 'patient_serial');
    }
}
