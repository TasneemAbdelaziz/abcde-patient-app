<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Generates prefixed, human-readable reference codes (e.g. "APT-3F9K2Q8M").
 *
 * Centralizes the scattered `PREFIX- . strtoupper(Str::random())` identifiers
 * used for appointments, complaints, emergencies and patient cards.
 */
class Reference
{
    public static function code(string $prefix, int $length = 8): string
    {
        return strtoupper($prefix . '-' . Str::random($length));
    }
}
