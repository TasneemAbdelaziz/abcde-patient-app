<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CommitteeReview;
use App\Models\InsuranceCoverage;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    /** GET /patients/{serial}/insurance — coverage category (FR13.1.1). */
    public function showInsurance(Request $request, string $serial): JsonResponse
    {
        if (! $this->canAccessPatient($request->user(), $serial)) {
            return $this->fail('Not allowed.', 403);
        }

        $coverage = InsuranceCoverage::where('patient_serial', $serial)->first();

        return $this->ok($coverage ?? ['patient_serial' => $serial, 'coverage_category' => null]);
    }

    /** PATCH /patients/{serial}/insurance — reception sets coverage. */
    public function updateInsurance(Request $request, string $serial): JsonResponse
    {
        $data = $request->validate([
            'coverage_category' => ['required', 'in:insured,employer_paid,uninsured_able,uninsured_unable,state,pension,student'],
            'payer_name' => ['nullable', 'string'],
            'policy_no' => ['nullable', 'string'],
            'determined_from' => ['nullable', 'in:national_id,manual'],
            'notes' => ['nullable', 'string'],
        ]);
        Patient::findOrFail($serial);

        $coverage = InsuranceCoverage::updateOrCreate(
            ['patient_serial' => $serial],
            $data,
        );

        return $this->ok($coverage, 'Insurance updated.');
    }

    /** POST /visits/{id}/billing/committee-review — funding committee referral. */
    public function committeeReview(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string']]);
        Visit::findOrFail($id);

        $review = CommitteeReview::create([
            'ticket_no' => $id,
            'review_type' => 'funding',
            'reason' => $data['reason'],
            'decision' => 'pending',
        ]);

        return $this->ok($review, 'Referred to the funding committee.', 201);
    }

    /** GET /visits/{id}/financial-file — itemised bill + payments (FR13). */
    public function financialFile(Request $request, string $id): JsonResponse
    {
        $visit = Visit::with('billingItems', 'payments')->findOrFail($id);
        if (! $this->canAccessPatient($request->user(), $visit->patient_serial)) {
            return $this->fail('Not allowed.', 403);
        }

        $items = $visit->billingItems;
        $total = $items->sum(fn ($i) => $i->line_total);
        $insured = $items->where('covered_by_insurance', true)->sum(fn ($i) => $i->line_total);
        $paid = $visit->payments->where('status', 'paid')->sum('amount');

        return $this->ok([
            'ticket_no' => $id,
            'items' => $items,
            'totals' => [
                'gross' => round($total, 2),
                'covered_by_insurance' => round($insured, 2),
                'patient_responsibility' => round($total - $insured, 2),
                'paid' => round($paid, 2),
                'outstanding' => round(max(0, ($total - $insured) - $paid), 2),
            ],
            'payments' => $visit->payments,
        ]);
    }

    /** POST /visits/{id}/payments — record a payment (FR13.1.2). */
    public function pay(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'in:cash,card,wallet,state'],
            'reference' => ['nullable', 'string'],
        ]);
        $visit = Visit::findOrFail($id);
        if (! $this->canAccessPatient($request->user(), $visit->patient_serial)) {
            return $this->fail('Not allowed.', 403);
        }

        $payment = Payment::create([
            'ticket_no' => $id,
            'amount' => $data['amount'],
            'method' => $data['method'],
            'status' => 'paid',
            'reference' => $data['reference'] ?? 'RCP-' . now()->format('YmdHis'),
            'paid_at' => now(),
        ]);

        return $this->ok($payment, 'Payment recorded.', 201);
    }
}
