<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
    protected $table = 'staff';
    protected $primaryKey = 'staff_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'staff_id', 'full_name', 'system_role', 'dept_code', 'specialty',
        'on_call', 'phone_extension', 'work_email', 'user_id',
    ];

    protected $casts = [
        'on_call' => 'boolean',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'dept_code', 'dept_code');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class, 'treating_doctor_id', 'staff_id');
    }
}
