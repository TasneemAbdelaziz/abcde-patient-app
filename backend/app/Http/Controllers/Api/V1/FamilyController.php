<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Family\StoreCompanionRequest;
use App\Http\Requests\Family\UpdateCompanionPermissionsRequest;
use App\Http\Resources\FamilyCompanionResource;
use App\Models\FamilyCompanion;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FamilyController extends Controller
{
    /** POST /patients/{serial}/family — add a companion, max one per patient (FR11.1.1). */
    public function store(StoreCompanionRequest $request, string $serial): JsonResponse
    {
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $serial)) {
            return $deny;
        }

        if (FamilyCompanion::where('patient_serial', $serial)->exists()) {
            return $this->fail('This patient already has a companion (maximum one).', 422);
        }

        Patient::findOrFail($serial);

        $companion = FamilyCompanion::create(array_merge(
            ['patient_serial' => $serial],
            $request->validated(),
        ));

        return $this->ok(new FamilyCompanionResource($companion), 'Companion invited.', 201);
    }

    /** GET /patients/{serial}/family — view the companion link. */
    public function index(Request $request, string $serial): JsonResponse
    {
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $serial)) {
            return $deny;
        }

        return $this->ok(FamilyCompanionResource::collection(
            FamilyCompanion::where('patient_serial', $serial)->get()
        ));
    }

    /** POST /family/{id}/accept — companion accepts the invitation (FR11.1.1). */
    public function accept(Request $request, int $id): JsonResponse
    {
        $companion = FamilyCompanion::findOrFail($id);
        $companion->update([
            'accepted_at' => now(),
            'user_id' => $request->user()->id,
        ]);

        return $this->ok(new FamilyCompanionResource($companion), 'Link accepted.');
    }

    /** PATCH /family/{id}/permissions — patient sets companion permissions (FR11.1.2). */
    public function permissions(UpdateCompanionPermissionsRequest $request, int $id): JsonResponse
    {
        $companion = FamilyCompanion::findOrFail($id);
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $companion->patient_serial)) {
            return $deny;
        }

        $companion->update($request->validated());

        return $this->ok(new FamilyCompanionResource($companion), 'Permissions updated.');
    }

    /** DELETE /family/{id} — patient removes the companion. */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $companion = FamilyCompanion::findOrFail($id);
        if ($deny = $this->denyUnlessPatientAccess($request->user(), $companion->patient_serial)) {
            return $deny;
        }
        $companion->delete();

        return $this->ok(null, 'Companion removed.');
    }
}
