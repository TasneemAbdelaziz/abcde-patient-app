<?php

namespace App\Services;

use App\Models\Vital;

/**
 * NEWS2 (National Early Warning Score 2) calculator — FR5.3.
 * Aggregates respiratory rate, SpO2, temperature, systolic BP, pulse and
 * consciousness (AVPU) into a single deterioration score and risk band.
 */
class News2Service
{
    /** @return array{score:int,risk_level:string,breakdown:array<string,int>} */
    public function score(Vital $v): array
    {
        $b = [
            'respiratory_rate' => $this->respiratory($v->respiratory_rate),
            'spo2' => $this->spo2($v->spo2),
            'temperature' => $this->temperature($v->temperature !== null ? (float) $v->temperature : null),
            'systolic_bp' => $this->systolic($v->systolic_bp),
            'pulse' => $this->pulse($v->pulse),
            'consciousness' => $this->consciousness($v->consciousness_avpu),
        ];

        $score = array_sum($b);
        $hasRedFlag = in_array(3, $b, true); // any single parameter scoring 3

        $risk = match (true) {
            $score >= 7 => 'high',
            $score >= 5 || $hasRedFlag => 'medium',
            default => 'low',
        };

        return ['score' => $score, 'risk_level' => $risk, 'breakdown' => $b];
    }

    private function respiratory(?int $rr): int
    {
        if ($rr === null) return 0;
        return match (true) {
            $rr <= 8 => 3,
            $rr <= 11 => 1,
            $rr <= 20 => 0,
            $rr <= 24 => 2,
            default => 3,
        };
    }

    private function spo2(?int $spo2): int
    {
        if ($spo2 === null) return 0;
        return match (true) {
            $spo2 <= 91 => 3,
            $spo2 <= 93 => 2,
            $spo2 <= 95 => 1,
            default => 0,
        };
    }

    private function temperature(?float $t): int
    {
        if ($t === null) return 0;
        return match (true) {
            $t <= 35.0 => 3,
            $t <= 36.0 => 1,
            $t <= 38.0 => 0,
            $t <= 39.0 => 1,
            default => 2,
        };
    }

    private function systolic(?int $sbp): int
    {
        if ($sbp === null) return 0;
        return match (true) {
            $sbp <= 90 => 3,
            $sbp <= 100 => 2,
            $sbp <= 110 => 1,
            $sbp <= 219 => 0,
            default => 3,
        };
    }

    private function pulse(?int $p): int
    {
        if ($p === null) return 0;
        return match (true) {
            $p <= 40 => 3,
            $p <= 50 => 1,
            $p <= 90 => 0,
            $p <= 110 => 1,
            $p <= 130 => 2,
            default => 3,
        };
    }

    private function consciousness(?string $avpu): int
    {
        // A = Alert scores 0; V/P/U (new confusion or reduced) scores 3.
        return strtoupper((string) $avpu) === 'A' || $avpu === null ? 0 : 3;
    }
}
