<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HospitalSetting extends Model
{
    protected $fillable = ['field', 'value'];

    public static function value(string $field, $default = null)
    {
        return static::where('field', $field)->value('value') ?? $default;
    }
}
