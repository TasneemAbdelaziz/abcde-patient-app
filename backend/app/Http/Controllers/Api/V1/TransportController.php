<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TransportForm;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransportController extends Controller
{
    /** POST /visits/{id}/transport — internal transport safety form / RSTP (FR4.6.2). */
    public function store(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'from_location' => ['required', 'string'],
            'to_location' => ['required', 'string'],
            'monitoring' => ['nullable', 'array'],
        ]);
        Visit::findOrFail($id);

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
