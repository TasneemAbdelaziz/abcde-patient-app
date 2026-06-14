<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\EmergencySosLog;
use App\Models\FeedbackRating;
use App\Models\KpiMonthly;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /** GET /reports/kpis — live KPIs computed from current data (FR17.2.1). */
    public function kpis(): JsonResponse
    {
        $d2b = Visit::whereNotNull('door_time')->whereNotNull('balloon_time')->get()
            ->map->door_to_balloon_minutes->filter();
        $ratings = FeedbackRating::all();
        $sos = EmergencySosLog::all()->map->response_seconds->filter();
        $complaints = Complaint::all();
        $answered = $complaints->filter(fn ($c) => $c->answered_within_sla === true)->count();
        $resolvable = $complaints->filter(fn ($c) => $c->answered_within_sla !== null)->count();

        return $this->ok([
            'avg_door_to_balloon_min' => $d2b->isNotEmpty() ? round($d2b->avg()) : null,
            'cardiac_cases' => Visit::where('catheterization_type', 'cardiac')->count(),
            'avg_satisfaction' => $ratings->isNotEmpty() ? round($ratings->avg('stars'), 2) : null,
            'complaints_total' => $complaints->count(),
            'complaints_answered_within_6h_pct' => $resolvable > 0 ? round($answered / $resolvable * 100) : null,
            'avg_sos_response_seconds' => $sos->isNotEmpty() ? round($sos->avg()) : null,
            'open_visits' => Visit::where('visit_status', 'open')->count(),
        ]);
    }

    /** GET /reports/monthly — historical monthly KPI series (FR17.2.1). */
    public function monthly(Request $request): JsonResponse
    {
        $rows = KpiMonthly::query()
            ->when($request->filled('from'), fn ($q) => $q->where('month', '>=', $request->from))
            ->when($request->filled('to'), fn ($q) => $q->where('month', '<=', $request->to))
            ->orderBy('month')
            ->get();

        return $this->ok($rows);
    }
}
