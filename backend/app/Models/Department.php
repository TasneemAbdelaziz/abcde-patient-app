<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $primaryKey = 'dept_code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'dept_code', 'department_name', 'description',
        'accepts_bookings', 'head_of_department',
    ];

    protected $casts = [
        'accepts_bookings' => 'boolean',
    ];

    public function staff(): HasMany
    {
        return $this->hasMany(Staff::class, 'dept_code', 'dept_code');
    }

    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class, 'dept_code', 'dept_code');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'dept_code', 'dept_code');
    }
}
