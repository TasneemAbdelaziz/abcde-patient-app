<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Drug extends Model
{
    protected $fillable = [
        'drug_name', 'form', 'strength', 'code',
        'currently_available', 'approx_stock_qty', 'part_of_cardiac_protocol',
    ];

    protected $casts = [
        'currently_available' => 'boolean',
        'part_of_cardiac_protocol' => 'boolean',
        'approx_stock_qty' => 'integer',
    ];
}
