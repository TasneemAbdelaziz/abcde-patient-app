<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EmergencySosLog;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmergencyController extends Controller
{
    public function __construct(private readonly NotificationService $notifier)
    {
    }

    /** POST /emergency/sos — patient/family raise an SOS (FR12.2.1). */
    public function sos(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ticket_no' => ['nullable', 'string'],
            'location' => ['nullable', 'string'],
        ]);
        $user = $request->user();

        $event = EmergencySosLog::create([
            'event_id' => 'E-' . strtoupper(Str::random(8)),
            'event_type' => 'sos',
            'ticket_no' => $data['ticket_no'] ?? null,
            'triggered_by' => $user->role === 'family' ? 'family' : 'patient',
            'started_at' => now(),
            'physician_alerted_at' => now(), // first link of the escalation chain
        ]);

        if ($user->patient_serial) {
            $this->notifier->toPatient($user->patient_serial, 'SOS received — help is on the way', 'sos', null, ['event_id' => $event->event_id]);
        }

        return $this->ok($event, 'SOS raised.', 201);
    }

    /** POST /emergency/code-blue — clinical Code Blue activation (FR12.2.2). */
    public function codeBlue(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ticket_no' => ['nullable', 'string'],
            'location' => ['required', 'string'],
        ]);

        $event = EmergencySosLog::create([
            'event_id' => 'E-' . strtoupper(Str::random(8)),
            'event_type' => 'code_blue',
            'ticket_no' => $data['ticket_no'] ?? null,
            'triggered_by' => 'nurse',
            'started_at' => now(),
            'physician_alerted_at' => now(),
            'nursing_alerted_at' => now(),
            'classification' => 'real_emergency',
        ]);

        return $this->ok($event, 'Code Blue activated.', 201);
    }

    /** GET /emergency/active — unresolved events for the response team. */
    public function active(): JsonResponse
    {
        return $this->ok(
            EmergencySosLog::whereNull('resolved_at')->orderByDesc('started_at')->get()
        );
    }

    /** POST /emergency/{id}/answer — a responder answers an event. */
    public function answer(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'answered_by' => ['nullable', 'string'],
            'classification' => ['nullable', 'in:real_emergency,heads_up'],
            'resolve' => ['nullable', 'boolean'],
        ]);
        $event = EmergencySosLog::findOrFail($id);
        $event->update(array_filter([
            'answered_by' => $data['answered_by'] ?? $request->user()->name,
            'classification' => $data['classification'] ?? $event->classification,
            'resolved_at' => $request->boolean('resolve') ? now() : $event->resolved_at,
        ]));

        return $this->ok($event, 'Event answered.');
    }

    /** POST /emergency/{id}/advance — step the escalation chain (FR12). */
    public function advance(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'step' => ['required', 'in:physician,nursing,family,resolved'],
        ]);
        $event = EmergencySosLog::findOrFail($id);

        match ($data['step']) {
            'physician' => $event->physician_alerted_at ??= now(),
            'nursing' => $event->nursing_alerted_at ??= now(),
            'family' => $event->family_alerted_at ??= now(),
            'resolved' => $event->resolved_at = now(),
        };
        $event->save();

        return $this->ok($event, 'Escalation advanced to :step.', 200, ['step' => $data['step']]);
    }

    /** GET /emergency/metrics — SOS response KPIs (FR12, director/emergency). */
    public function metrics(): JsonResponse
    {
        $events = EmergencySosLog::all();
        $responses = $events->map->response_seconds->filter();

        return $this->ok([
            'total_events' => $events->count(),
            'active' => $events->whereNull('resolved_at')->count(),
            'real_emergencies' => $events->where('classification', 'real_emergency')->count(),
            'avg_response_seconds' => $responses->isNotEmpty() ? round($responses->avg()) : null,
            'by_type' => $events->groupBy('event_type')->map->count(),
        ]);
    }
}
