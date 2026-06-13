<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\EducationContent;
use App\Models\HospitalSetting;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    /** GET /public/hospital — profile, contacts, hours (FR2.1). */
    public function hospital(): JsonResponse
    {
        return $this->ok(HospitalSetting::pluck('value', 'field'));
    }

    /** GET /public/departments — directory of departments (FR2.2). */
    public function departments(): JsonResponse
    {
        return $this->ok(
            Department::orderBy('department_name')->get()->map(fn ($d) => [
                'dept_code' => $d->dept_code,
                'department_name' => $d->department_name,
                'description' => $d->description,
                'accepts_bookings' => $d->accepts_bookings,
                'head_of_department' => $d->head_of_department,
            ])
        );
    }

    /** GET /public/doctors — public doctor directory, filterable by specialty/dept. */
    public function doctors(Request $request): JsonResponse
    {
        $doctors = Staff::query()
            ->where('system_role', 'doctor')
            ->when($request->filled('dept_code'), fn ($q) => $q->where('dept_code', $request->dept_code))
            ->when($request->filled('specialty'), fn ($q) => $q->where('specialty', 'like', "%{$request->specialty}%"))
            ->with('department')
            ->get()
            ->map(fn ($s) => [
                'staff_id' => $s->staff_id,
                'full_name' => $s->full_name,
                'specialty' => $s->specialty,
                'department' => $s->department?->department_name,
                'dept_code' => $s->dept_code,
            ]);

        return $this->ok($doctors);
    }

    /** GET /public/news — news & patient stories (FR2.3). */
    public function news(): JsonResponse
    {
        // Reuses approved education/article content as the public news feed.
        return $this->ok(
            EducationContent::whereIn('content_type', ['article', 'video'])
                ->latest()
                ->take(20)
                ->get()
        );
    }
}
