<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\CommitteeReviewRequest;
use App\Http\Requests\Billing\StorePaymentRequest;
use App\Http\Requests\Billing\UpdateInsuranceRequest;
use App\Http\Resources\BillingItemResource;
use App\Http\Resources\CommitteeReviewResource;
use App\Http\Resources\InsuranceCoverageResource;
use App\Http\Resources\PaymentResource;
use App\Http\Traits\ResolvesVisit;
use App\Models\CommitteeReview;
use App\Models\InsuranceCoverage;
use App\Models\Patient;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    use ResolvesVisit;

    /** GET /patients/{serial}/insurance — coverage category (FR13.1.1). */
    public function showInsurance(Request $request, string $serial): JsonResponse
    {
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $serial)) {
            return $deny;
        }

        $coverage = InsuranceCoverage::where('patient_serial', $serial)->first();

        return $this->ok($coverage
            ? new InsuranceCoverageResource($coverage)
            : ['patient_serial' => $serial, 'coverage_category' => null]);
    }

    /** PATCH /patients/{serial}/insurance — reception sets coverage. */
    public function updateInsurance(UpdateInsuranceRequest $request, string $serial): JsonResponse
    {
        Patient::findOrFail($serial);

        $coverage = InsuranceCoverage::updateOrCreate(
            ['patient_serial' => $serial],
            $request->validated(),
        );

        return $this->ok(new InsuranceCoverageResource($coverage), 'Insurance updated.');
    }

    /** POST /visits/{id}/billing/committee-review — funding committee referral. */
    public function committeeReview(CommitteeReviewRequest $request, string $id): JsonResponse
    {
        $this->visit($id);

        $review = CommitteeReview::create([
            'ticket_no' => $id,
            'review_type' => 'funding',
            'reason' => $request->validated()['reason'],
            'decision' => 'pending',
        ]);

        return $this->ok(new CommitteeReviewResource($review), 'Referred to the funding committee.', 201);
    }

    /** GET /visits/{id}/financial-file — itemised bill + payments (FR13). */
    public function financialFile(Request $request, string $id): JsonResponse
    {
        $visit = $this->visit($id, ['billingItems', 'payments']);
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $visit->patient_serial)) {
            return $deny;
        }

        $items = $visit->billingItems;
        $total = $items->sum(fn ($i) => $i->line_total);
        $insured = $items->where('covered_by_insurance', true)->sum(fn ($i) => $i->line_total);
        $paid = $visit->payments->where('status', 'paid')->sum('amount');

        return $this->ok([
            'ticket_no' => $id,
            'items' => BillingItemResource::collection($items),
            'totals' => [
                'gross' => round($total, 2),
                'covered_by_insurance' => round($insured, 2),
                'patient_responsibility' => round($total - $insured, 2),
                'paid' => round($paid, 2),
                'outstanding' => round(max(0, ($total - $insured) - $paid), 2),
            ],
            'payments' => PaymentResource::collection($visit->payments),
        ]);
    }

    /** POST /visits/{id}/payments — record a payment (FR13.1.2). */
    public function pay(StorePaymentRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $visit = $this->visit($id);
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $visit->patient_serial)) {
            return $deny;
        }

        $payment = Payment::create([
            'ticket_no' => $id,
            'amount' => $data['amount'],
            'method' => $data['method'],
            'status' => 'paid',
            'reference' => $data['reference'] ?? 'RCP-' . now()->format('YmdHis'),
            'paid_at' => now(),
        ]);

        return $this->ok(new PaymentResource($payment), 'Payment recorded.', 201);
    }
}
