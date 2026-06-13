<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ConsentChecklist;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsentController extends Controller
{
    /** POST /visits/{id}/consents — doctor requests informed consent (FR4.5.1). */
    public function store(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'item' => ['required', 'string', 'max:255'],
        ]);
        Visit::findOrFail($id);

        $consent = ConsentChecklist::create([
            'ticket_no' => $id,
            'record_type' => 'consent',
            'item' => $data['item'],
            'requested_at' => now(),
        ]);

        return $this->ok($consent, 'Consent requested.', 201);
    }

    /** POST /consents/{id}/respond — patient or decision-maker responds (FR4.5.1). */
    public function respond(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'decision' => ['required', 'in:given,declined'],
            'responded_by' => ['nullable', 'string', 'max:255'],
        ]);
        $consent = ConsentChecklist::findOrFail($id);

        $user = $request->user();
        if (! $this->canAccessPatient($user, $consent->visit?->patient_serial ?? '')) {
            return $this->fail('Only the patient or their decision-maker may respond.', 403);
        }

        $consent->update([
            'decision' => $data['decision'],
            'responded_by' => $data['responded_by'] ?? $user->name,
            'responded_at' => now(),
        ]);

        return $this->ok($consent, 'Consent response recorded.');
    }

    /** POST /visits/{id}/checklists — nurse pre-op / safety time-out (FR4.5.2). */
    public function checklist(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'record_type' => ['required', 'in:preop_checklist,surgical_timeout'],
            'item' => ['required', 'string', 'max:255'],
            'decision' => ['nullable', 'in:completed,declined'],
        ]);
        Visit::findOrFail($id);

        $record = ConsentChecklist::create([
            'ticket_no' => $id,
            'record_type' => $data['record_type'],
            'item' => $data['item'],
            'requested_at' => now(),
            'decision' => $data['decision'] ?? 'completed',
            'responded_by' => $request->user()->name,
            'responded_at' => now(),
        ]);

        return $this->ok($record, 'Checklist item recorded.', 201);
    }
}
