<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    protected $primaryKey = 'location_code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'location_code', 'location_name', 'floor',
        'location_type', 'wheelchair_accessible',
    ];

    protected $casts = [
        'wheelchair_accessible' => 'boolean',
    ];

    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class, 'location_code', 'location_code');
    }
}
