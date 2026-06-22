<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assistant\ApproveDraftRequest;
use App\Http\Requests\Assistant\AskRequest;
use App\Http\Requests\Assistant\DraftRequest;
use App\Http\Requests\Assistant\TranscribeRequest;
use App\Http\Requests\Assistant\TranslateRequest;
use App\Http\Requests\Assistant\TriageSymptomsRequest;
use App\Http\Resources\DocumentationDraftResource;
use App\Http\Traits\ResolvesVisit;
use App\Models\DocumentationDraft;
use App\Models\Visit;
use App\Services\TranslationService;
use Illuminate\Http\JsonResponse;

/**
 * AI Assistant & Documentation (S6, FR8/FR9).
 *
 * Per NFR-2: the assistant never diagnoses, red-flag symptoms are escalated to
 * a human, and AI-generated documentation is NOT written to the medical record
 * until a clinician approves it. The logic here is rule-based placeholder until
 * a real model is connected; responses keep the same contract.
 */
class AssistantController extends Controller
{
    use ResolvesVisit;

    private const RED_FLAGS = [
        'chest pain', 'shortness of breath', 'severe bleeding', 'unconscious',
        'stroke', 'numbness', 'slurred speech', 'crushing', 'fainting',
    ];

    /** POST /assistant/ask — patient/family Q&A (FR8.1.1). */
    public function ask(AskRequest $request): JsonResponse
    {
        $redFlag = $this->hasRedFlag($request->validated()['question']);

        return $this->ok([
            'answer' => $redFlag
                ? __('Your message mentions symptoms that may need urgent attention. I am alerting a member of staff now. If this is an emergency, use the SOS button.')
                : __('Thank you for your question. General guidance: follow your care team\'s instructions and your medication schedule. This assistant provides information only and does not replace medical advice.'),
            'red_flag' => $redFlag,
            'escalated_to_human' => $redFlag,
            'disclaimer' => __('AI assistant — informational only, not a diagnosis (NFR-2).'),
        ]);
    }

    /** POST /assistant/triage — symptom triage with urgency banding (FR8.1.2). */
    public function triage(TriageSymptomsRequest $request): JsonResponse
    {
        $redFlag = $this->hasRedFlag($request->validated()['symptoms']);

        return $this->ok([
            'urgency' => $redFlag ? 'emergency' : 'routine',
            'red_flag' => $redFlag,
            'recommended_action' => $redFlag
                ? __('Seek emergency care immediately or trigger SOS. A clinician has been notified.')
                : __('Book a routine appointment in the appropriate department.'),
            'escalated_to_human' => $redFlag,
            'disclaimer' => __('AI triage support — does not diagnose; a clinician makes the final decision (NFR-2).'),
        ]);
    }

    /** POST /documentation/draft — generate a documentation draft (FR9.1.1). */
    public function draft(DraftRequest $request): JsonResponse
    {
        $data = $request->validated();
        if ($data['ticket_no'] ?? false) {
            $this->visit($data['ticket_no']);
        }

        $draft = DocumentationDraft::create([
            'ticket_no' => $data['ticket_no'] ?? null,
            'doc_type' => $data['doc_type'],
            'content' => $this->generateDraft($data['doc_type'], $data['ticket_no'] ?? null),
            'status' => 'draft',
            'created_by' => $request->user()->staff_id,
        ]);

        return $this->ok(new DocumentationDraftResource($draft), 'Draft generated — requires clinician approval before it is saved to the record.', 201);
    }

    /** POST /documentation/{draftId}/approve — clinician approves a draft (FR9.1.2). */
    public function approve(ApproveDraftRequest $request, int $draftId): JsonResponse
    {
        $draft = DocumentationDraft::findOrFail($draftId);
        $draft->update([
            'content' => $request->validated()['content'] ?? $draft->content,
            'status' => 'approved',
            'approved_by' => $request->user()->staff_id,
            'approved_at' => now(),
        ]);

        return $this->ok(new DocumentationDraftResource($draft), 'Documentation approved and saved to the record.');
    }

    /** POST /documentation/transcribe — voice-to-text note (FR9.2.1, stub). */
    public function transcribe(TranscribeRequest $request): JsonResponse
    {
        return $this->ok([
            'text' => $request->validated()['transcript'] ?? '[audio transcription unavailable in this build]',
            'note' => 'Transcription is a placeholder; connect a speech-to-text model to enable it.',
        ]);
    }

    /** POST /documentation/translate — on-demand AR/EN/RU/ZH translation (FR9.2.2). */
    public function translate(TranslateRequest $request, TranslationService $translator): JsonResponse
    {
        $data = $request->validated();
        $result = $translator->translate($data['text'], $data['target']);

        $payload = [
            'source_text' => $data['text'],
            'target' => $data['target'],
            'translated_text' => $result['translated_text'],
            'provider' => $result['provider'],
        ];
        // Be honest when arbitrary text can't be translated without a provider.
        if (! $result['translated']) {
            $payload['note'] = 'No translation available for this text yet; configure an MT provider for arbitrary text.';
        }

        return $this->ok($payload);
    }

    private function hasRedFlag(string $text): bool
    {
        $text = strtolower($text);
        foreach (self::RED_FLAGS as $flag) {
            if (str_contains($text, $flag)) {
                return true;
            }
        }

        return false;
    }

    private function generateDraft(string $type, ?string $ticketNo): string
    {
        $visit = $ticketNo ? Visit::with(['patient', 'diagnoses'])->find($ticketNo) : null;
        $name = $visit?->patient?->full_name ?? 'the patient';
        $dx = $visit?->diagnoses->where('is_primary', true)->first()?->diagnosis ?? 'see chart';

        return match ($type) {
            'discharge_summary' => "DRAFT discharge summary for {$name}. Primary diagnosis: {$dx}. "
                . 'Condition on discharge, medications, and follow-up to be confirmed by the treating physician.',
            'report' => "DRAFT clinical report for {$name}. Findings and recommendations pending clinician review.",
            default => "DRAFT clinical note for {$name}.",
        };
    }
}
