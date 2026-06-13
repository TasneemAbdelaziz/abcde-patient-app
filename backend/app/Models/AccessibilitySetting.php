<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccessibilitySetting extends Model
{
    protected $fillable = [
        'patient_serial', 'high_contrast', 'screen_reader', 'text_to_speech',
        'captions', 'haptics', 'simple_mode', 'font_scale', 'extra',
    ];

    protected $casts = [
        'high_contrast' => 'boolean',
        'screen_reader' => 'boolean',
        'text_to_speech' => 'boolean',
        'captions' => 'boolean',
        'haptics' => 'boolean',
        'simple_mode' => 'boolean',
        'font_scale' => 'decimal:1',
        'extra' => 'array',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_serial', 'patient_serial');
    }
}
