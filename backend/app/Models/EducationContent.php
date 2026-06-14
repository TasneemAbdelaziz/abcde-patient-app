<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EducationContent extends Model
{
    protected $fillable = [
        'title', 'content_type', 'condition', 'journey_stage',
        'duration_min', 'file_or_link', 'approved_by',
    ];

    protected $casts = [
        'duration_min' => 'integer',
    ];
}
