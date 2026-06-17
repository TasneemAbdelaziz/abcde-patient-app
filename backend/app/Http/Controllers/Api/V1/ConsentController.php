<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Consent\ChecklistRequest;
use App\Http\Requests\Consent\RespondConsentRequest;
use App\Http\Requests\Consent\StoreConsentRequest;
use App\Http\Resources\ConsentChecklistResource;
use App\Http\Traits\ResolvesVisit;
use App\Models\ConsentChecklist;
use Illuminate\Http\JsonResponse;

class ConsentController extends Controller
{
    use ResolvesVisit;

    /** POST /visits/{id}/consents — doctor requests informed consent (FR4.5.1). */
    public function store(StoreConsentRequest $request, string $id): JsonResponse
    {
        $this->visit($id);

        $consent = ConsentChecklist::create([
            'ticket_no' => $id,
            'record_type' => 'consent',
            'item' => $request->validated()['item'],
            'requested_at' => now(),
        ]);

        return $this->ok(new ConsentChecklistResource($consent), 'Consent requested.', 201);
    }

    /** POST /consents/{id}/respond — patient or decision-maker responds (FR4.5.1). */
    public function respond(RespondConsentRequest $request, int $id): JsonResponse
    {
        $data = $request->validated();
        $consent = ConsentChecklist::findOrFail($id);

        $user = $request->user();
        if ($deny = $this->denyUnlessPatientAccess($user, $consent->visit?->patient_serial, 'Only the patient or their decision-maker may respond.')) {
            return $deny;
        }

        $consent->update([
            'decision' => $data['decision'],
            'responded_by' => $data['responded_by'] ?? $user->name,
            'responded_at' => now(),
        ]);

        return $this->ok(new ConsentChecklistResource($consent), 'Consent response recorded.');
    }

    /** POST /visits/{id}/checklists — nurse pre-op / safety time-out (FR4.5.2). */
    public function checklist(ChecklistRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $this->visit($id);

        $record = ConsentChecklist::create([
            'ticket_no' => $id,
            'record_type' => $data['record_type'],
            'item' => $data['item'],
            'requested_at' => now(),
            'decision' => $data['decision'] ?? 'completed',
            'responded_by' => $request->user()->name,
            'responded_at' => now(),
        ]);

        return $this->ok(new ConsentChecklistResource($record), 'Checklist item recorded.', 201);
    }
}
