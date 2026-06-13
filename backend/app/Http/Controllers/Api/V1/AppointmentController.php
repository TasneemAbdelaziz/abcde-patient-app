<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    /** POST /appointments — request an appointment (public guest or patient). */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'dept_code' => ['required', 'string', 'exists:departments,dept_code'],
            'complaint' => ['nullable', 'string', 'max:1000'],
            'requested_at' => ['nullable', 'date'],
            'guest_name' => ['nullable', 'string', 'max:255'],
            'guest_phone' => ['nullable', 'string', 'max:30'],
        ]);

        $user = $request->user();
        if ($user && $user->patient_serial) {
            $serial = $user->patient_serial;
            $raw = $serial;
        } else {
            $request->validate([
                'guest_name' => ['required', 'string'],
                'guest_phone' => ['required', 'string'],
            ]);
            $serial = null;
            $raw = "guest: {$data['guest_name']} / {$data['guest_phone']}";
        }

        $appointment = Appointment::create([
            'appointment_id' => 'APT-' . strtoupper(Str::random(8)),
            'patient_serial_or_guest' => $raw,
            'patient_serial' => $serial,
            'dept_code' => $data['dept_code'],
            'complaint' => $data['complaint'] ?? null,
            'requested_at' => $data['requested_at'] ?? now(),
            'status' => 'pending',
        ]);

        return $this->ok($appointment, 'Appointment requested.', 201);
    }

    /** GET /appointments — patient sees own; staff sees all (filterable). */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $appointments = Appointment::query()
            ->with(['department', 'doctor'])
            ->when(! $user->isStaff(), fn ($q) => $q->where('patient_serial', $user->patient_serial))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('dept_code'), fn ($q) => $q->where('dept_code', $request->dept_code))
            ->orderByDesc('requested_at')
            ->get();

        return $this->ok($appointments);
    }

    /** GET /appointments/slots — available slots for a department (public). */
    public function slots(Request $request): JsonResponse
    {
        $request->validate([
            'dept_code' => ['required', 'string'],
            'date' => ['nullable', 'date'],
        ]);

        // Generated availability: hourly slots 09:00–17:00, excluding taken ones.
        $date = Carbon::parse($request->input('date', now()->addDay()->toDateString()));
        $taken = Appointment::where('dept_code', $request->dept_code)
            ->whereDate('scheduled_at', $date->toDateString())
            ->pluck('scheduled_at')
            ->map(fn ($t) => $t?->format('H:i'))
            ->filter()
            ->all();

        $slots = [];
        for ($h = 9; $h <= 17; $h++) {
            $time = sprintf('%02d:00', $h);
            $slots[] = [
                'time' => $time,
                'datetime' => $date->copy()->setTime($h, 0)->toDateTimeString(),
                'available' => ! in_array($time, $taken, true),
            ];
        }

        return $this->ok(['date' => $date->toDateString(), 'slots' => $slots]);
    }

    /** PATCH /appointments/{id}/reschedule — owner reschedules. */
    public function reschedule(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['scheduled_at' => ['required', 'date']]);
        $appointment = Appointment::findOrFail($id);

        if (! $this->ownsOrStaff($request, $appointment)) {
            return $this->fail('Not allowed.', 403);
        }

        $appointment->update([
            'scheduled_at' => $data['scheduled_at'],
            'status' => $appointment->status === 'pending' ? 'pending' : 'approved',
        ]);

        return $this->ok($appointment, 'Appointment rescheduled.');
    }

    /** DELETE /appointments/{id} — owner cancels. */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        if (! $this->ownsOrStaff($request, $appointment)) {
            return $this->fail('Not allowed.', 403);
        }

        $appointment->update(['status' => 'cancelled']);

        return $this->ok($appointment, 'Appointment cancelled.');
    }

    /** PATCH /appointments/{id}/status — reception approves/declines/completes. */
    public function setStatus(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,approved,declined,cancelled,completed'],
            'scheduled_at' => ['nullable', 'date'],
        ]);
        $appointment = Appointment::findOrFail($id);
        $appointment->update(array_filter([
            'status' => $data['status'],
            'scheduled_at' => $data['scheduled_at'] ?? $appointment->scheduled_at,
        ]));

        return $this->ok($appointment, 'Status updated.');
    }

    /** POST /appointments/{id}/assign — reception/director assigns a doctor. */
    public function assign(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'assigned_doctor_id' => ['required', 'string', 'exists:staff,staff_id'],
        ]);
        $appointment = Appointment::findOrFail($id);
        $appointment->update([
            'assigned_doctor_id' => $data['assigned_doctor_id'],
            'status' => $appointment->status === 'pending' ? 'approved' : $appointment->status,
        ]);

        return $this->ok($appointment, 'Doctor assigned.');
    }

    private function ownsOrStaff(Request $request, Appointment $appointment): bool
    {
        $user = $request->user();

        return $user->isStaff() || $appointment->patient_serial === $user->patient_serial;
    }
}
