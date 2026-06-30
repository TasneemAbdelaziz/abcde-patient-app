<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** All assignable system roles (FR1.3). */
    public const ROLES = [
        'patient', 'family', 'doctor', 'nurse', 'reception',
        'quality', 'director', 'admin', 'emergency',
    ];

    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'role',
        'staff_id',
        'patient_serial',
        'locale',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id', 'staff_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_serial', 'patient_serial');
    }

    /** Registered push (FCM) devices — the watch/phone pairing for remote-open. */
    public function devices(): HasMany
    {
        return $this->hasMany(DeviceToken::class);
    }

    public function isStaff(): bool
    {
        return ! in_array($this->role, ['patient', 'family'], true);
    }

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }
}
