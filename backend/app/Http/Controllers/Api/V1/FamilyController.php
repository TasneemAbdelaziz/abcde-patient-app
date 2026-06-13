<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FamilyCompanion;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FamilyController extends Controller
{
    /** POST /patients/{serial}/family — add a companion, max one per patient (FR11.1.1). */
    public function store(Request $request, string $serial): JsonResponse
    {
        if (! $this->canAccessPatient($request->user(), $serial)) {
            return $this->fail('Not allowed.', 403);
        }

        if (FamilyCompanion::where('patient_serial', $serial)->exists()) {
            return $this->fail('This patient already has a companion (maximum one).', 422);
        }

        $data = $request->validate([
            'companion_name' => ['required', 'string', 'max:255'],
            'relation' => ['nullable', 'in:son,daughter,spouse,parent,sibling'],
            'companion_phone' => ['nullable', 'string', 'max:30'],
            'can_see_status' => ['nullable', 'boolean'],
            'receives_alerts' => ['nullable', 'boolean'],
            'can_book' => ['nullable', 'boolean'],
            'can_rate' => ['nullable', 'boolean'],
            'can_raise_emergency' => ['nullable', 'boolean'],
            'is_decision_maker' => ['nullable', 'boolean'],
        ]);
        Patient::findOrFail($serial);

        $companion = FamilyCompanion::create(array_merge(
            ['patient_serial' => $serial],
            $data,
        ));

        return $this->ok($companion, 'Companion invited.', 201);
    }

    /** GET /patients/{serial}/family — view the companion link. */
    public function index(Request $request, string $serial): JsonResponse
    {
        if (! $this->canAccessPatient($request->user(), $serial)) {
            return $this->fail('Not allowed.', 403);
        }

        return $this->ok(FamilyCompanion::where('patient_serial', $serial)->get());
    }

    /** POST /family/{id}/accept — companion accepts the invitation (FR11.1.1). */
    public function accept(Request $request, int $id): JsonResponse
    {
        $companion = FamilyCompanion::findOrFail($id);
        $companion->update([
            'accepted_at' => now(),
            'user_id' => $request->user()->id,
        ]);

        return $this->ok($companion, 'Link accepted.');
    }

    /** PATCH /family/{id}/permissions — patient sets companion permissions (FR11.1.2). */
    public function permissions(Request $request, int $id): JsonResponse
    {
        $companion = FamilyCompanion::findOrFail($id);
        if (! $this->canAccessPatient($request->user(), $companion->patient_serial)) {
            return $this->fail('Not allowed.', 403);
        }

        $data = $request->validate([
            'can_see_status' => ['nullable', 'boolean'],
            'receives_alerts' => ['nullable', 'boolean'],
            'can_book' => ['nullable', 'boolean'],
            'can_rate' => ['nullable', 'boolean'],
            'can_raise_emergency' => ['nullable', 'boolean'],
            'is_decision_maker' => ['nullable', 'boolean'],
        ]);
        $companion->update($data);

        return $this->ok($companion, 'Permissions updated.');
    }

    /** DELETE /family/{id} — patient removes the companion. */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $companion = FamilyCompanion::findOrFail($id);
        if (! $this->canAccessPatient($request->user(), $companion->patient_serial)) {
            return $this->fail('Not allowed.', 403);
        }
        $companion->delete();

        return $this->ok(null, 'Companion removed.');
    }
}
