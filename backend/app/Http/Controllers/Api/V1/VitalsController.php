<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\VitalResource;
use App\Models\Vital;
use App\Models\Visit;
use App\Services\News2Service;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class VitalsController extends Controller
{
    public function __construct(
        private readonly News2Service $news2,
        private readonly NotificationService $notifier,
    ) {
    }

    /** POST /visits/{id}/vitals — nurse records a vitals set (FR5.1). */
    public function store(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'systolic_bp' => ['nullable', 'integer', 'between:40,300'],
            'diastolic_bp' => ['nullable', 'integer', 'between:20,200'],
            'pulse' => ['nullable', 'integer', 'between:20,260'],
            'respiratory_rate' => ['nullable', 'integer', 'between:4,60'],
            'spo2' => ['nullable', 'integer', 'between:50,100'],
            'temperature' => ['nullable', 'numeric', 'between:30,45'],
            'pain_score' => ['nullable', 'integer', 'between:0,10'],
            'consciousness_avpu' => ['nullable', 'in:A,V,P,U'],
            'taken_at' => ['nullable', 'date'],
        ]);

        Visit::findOrFail($id);

        $vital = new Vital(array_merge($data, [
            'ticket_no' => $id,
            'nurse_id' => $request->user()->staff_id,
            'taken_at' => $data['taken_at'] ?? now(),
        ]));

        $result = $this->news2->score($vital);
        $vital->news2_score = $result['score'];
        $vital->risk_level = $result['risk_level'];
        $vital->save();

        // FR5.3.2 — deterioration alert.
        if ($result['risk_level'] !== 'low') {
            $this->notifier->toPatient(
                Visit::find($id)->patient_serial,
                'Clinical team notified of your readings',
                'alert',
                'Early-warning score :score (:risk)',
                [],
                ['score' => $result['score'], 'risk' => $result['risk_level']],
            );
        }

        return $this->ok([
            'vital' => new VitalResource($vital),
            'risk' => $result,
        ], 'Vitals recorded.', 201);
    }

    /** GET /visits/{id}/vitals — vitals trend (staff or owner). */
    public function index(Request $request, string $id): JsonResponse
    {
        $visit = Visit::findOrFail($id);
        if (! $this->canAccessPatient($request->user(), $visit->patient_serial)) {
            return $this->fail('Not allowed.', 403);
        }

        return $this->ok(VitalResource::collection(
            $visit->vitals()->orderBy('taken_at')->get()
        ));
    }

    /** GET /visits/{id}/risk-score — latest NEWS2 risk (FR5.3.1). */
    public function riskScore(string $id): JsonResponse
    {
        $visit = Visit::findOrFail($id);
        $latest = $visit->vitals()->latest('taken_at')->first();

        if (! $latest) {
            return $this->ok(['score' => null, 'risk_level' => null, 'message' => 'No vitals recorded yet.']);
        }

        return $this->ok([
            'ticket_no' => $id,
            'taken_at' => $latest->taken_at?->toDateTimeString(),
            'score' => $latest->news2_score,
            'risk_level' => $latest->risk_level,
            'breakdown' => $this->news2->score($latest)['breakdown'],
            'thresholds' => Cache::get("thresholds:{$id}"),
        ]);
    }

    /** POST /visits/{id}/risk-score/recompute — recompute scores for all vitals (FR5.3). */
    public function recompute(string $id): JsonResponse
    {
        $visit = Visit::findOrFail($id);
        $updated = 0;
        foreach ($visit->vitals as $vital) {
            $result = $this->news2->score($vital);
            $vital->update(['news2_score' => $result['score'], 'risk_level' => $result['risk_level']]);
            $updated++;
        }

        return $this->ok(['recomputed' => $updated], 'Risk scores recomputed.');
    }

    /** POST /visits/{id}/vte — Padua VTE risk score (FR5.3.3). */
    public function vte(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'factors' => ['required', 'array', 'min:1'],
            'factors.*.factor' => ['required', 'string'],
            'factors.*.points' => ['required', 'integer', 'min:0', 'max:3'],
        ]);
        Visit::findOrFail($id);

        $score = array_sum(array_column($data['factors'], 'points'));
        $highRisk = $score >= 4;

        return $this->ok([
            'ticket_no' => $id,
            'padua_score' => $score,
            'risk' => $highRisk ? 'high' : 'low',
            'prophylaxis_recommended' => $highRisk,
            'factors' => $data['factors'],
        ], 'VTE risk computed.');
    }

    /** PUT /visits/{id}/thresholds — doctor sets alerting thresholds (FR5.2.1). */
    public function thresholds(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'systolic_bp_min' => ['nullable', 'integer'],
            'systolic_bp_max' => ['nullable', 'integer'],
            'pulse_min' => ['nullable', 'integer'],
            'pulse_max' => ['nullable', 'integer'],
            'spo2_min' => ['nullable', 'integer'],
        ]);
        Visit::findOrFail($id);

        Cache::forever("thresholds:{$id}", $data);

        return $this->ok($data, 'Thresholds saved.');
    }
}
