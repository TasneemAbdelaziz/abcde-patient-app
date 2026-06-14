<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiMonthly extends Model
{
    protected $table = 'kpi_monthly';

    protected $fillable = [
        'month', 'avg_door_to_balloon_min', 'cardiac_cases_count',
        'avg_satisfaction', 'complaints_count',
        'complaints_answered_within_6h_pct', 'avg_sos_response_seconds',
    ];

    protected $casts = [
        'avg_door_to_balloon_min' => 'integer',
        'cardiac_cases_count' => 'integer',
        'avg_satisfaction' => 'decimal:1',
        'complaints_count' => 'integer',
        'complaints_answered_within_6h_pct' => 'integer',
        'avg_sos_response_seconds' => 'integer',
    ];
}
