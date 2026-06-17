<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Transport\StoreTransportRequest;
use App\Http\Traits\ResolvesVisit;
use App\Models\TransportForm;
use Illuminate\Http\JsonResponse;

class TransportController extends Controller
{
    use ResolvesVisit;

    /** POST /visits/{id}/transport — internal transport safety form / RSTP (FR4.6.2). */
    public function store(StoreTransportRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $this->visit($id);

        $form = TransportForm::create([
            'ticket_no' => $id,
            'from_location' => $data['from_location'],
            'to_location' => $data['to_location'],
            'monitoring' => $data['monitoring'] ?? null,
            'escorted_by' => $request->user()->name,
            'transported_at' => now(),
        ]);

        return $this->ok($form, 'Transport form recorded.', 201);
    }
}
