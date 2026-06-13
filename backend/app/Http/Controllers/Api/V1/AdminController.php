<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    private const ROLES = [
        'patient', 'family', 'doctor', 'nurse', 'reception',
        'quality', 'director', 'admin', 'emergency',
    ];

    /** POST /admin/users — create a staff/system account (FR17.1.1). */
    public function storeUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'unique:users,email'],
            'username' => ['required', 'string', 'unique:users,username'],
            'role' => ['required', Rule::in(self::ROLES)],
            'staff_id' => ['nullable', 'string'],
            'password' => ['required', 'string', 'min:6'],
            'locale' => ['nullable', 'in:ar,en,ru,zh'],
        ]);

        $user = User::create(array_merge($data, [
            'password' => Hash::make($data['password']),
            'locale' => $data['locale'] ?? 'en',
        ]));

        $this->audit($request, 'user.create', 'user', (string) $user->id, ['role' => $user->role]);

        return $this->ok($user->makeHidden('password'), 'User created.', 201);
    }

    /** GET /admin/users — list accounts. */
    public function indexUsers(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->filled('role'), fn ($q) => $q->where('role', $request->role))
            ->orderBy('name')
            ->get()
            ->makeHidden('password');

        return $this->ok($users);
    }

    /** PATCH /admin/users/{id}/role — change a user's role (FR1.3.1). */
    public function setRole(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(self::ROLES)],
            'is_active' => ['nullable', 'boolean'],
        ]);
        $user = User::findOrFail($id);
        $before = $user->role;
        $user->update(array_filter([
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? $user->is_active,
        ], fn ($v) => $v !== null));

        $this->audit($request, 'user.role_change', 'user', (string) $id, ['from' => $before, 'to' => $user->role]);

        return $this->ok($user->makeHidden('password'), 'Role updated.');
    }

    /** GET/PUT /admin/permissions — role → permission matrix (FR1.3). */
    public function permissions(Request $request): JsonResponse
    {
        if ($request->isMethod('put')) {
            $data = $request->validate(['matrix' => ['required', 'array']]);
            cache()->forever('rbac.matrix', $data['matrix']);
            $this->audit($request, 'permissions.update', 'rbac', 'matrix');

            return $this->ok($data['matrix'], 'Permission matrix saved.');
        }

        return $this->ok(cache('rbac.matrix', $this->defaultMatrix()));
    }

    /** GET /admin/audit — audit trail (FR17.2.2). */
    public function audit(Request $request, ?string $action = null, ?string $entityType = null, ?string $entityId = null, array $changes = []): JsonResponse|AuditLog
    {
        // Dual use: when called with an action it writes a log; otherwise it lists.
        if ($action !== null) {
            return AuditLog::create([
                'user_id' => $request->user()?->id,
                'actor' => $request->user()?->name,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'changes' => $changes ?: null,
                'ip' => $request->ip(),
                'created_at' => now(),
            ]);
        }

        return $this->ok(
            AuditLog::query()
                ->when($request->filled('action'), fn ($q) => $q->where('action', $request->action))
                ->latest('created_at')
                ->take(200)
                ->get()
        );
    }

    /** GET /admin/integrations — external system integration status (FR17.1.3). */
    public function integrations(): JsonResponse
    {
        return $this->ok([
            ['key' => 'hmis', 'name' => 'Hospital Management Information System', 'status' => 'not_connected'],
            ['key' => 'dms', 'name' => 'Document Management System', 'status' => 'not_connected'],
            ['key' => 'lab', 'name' => 'Laboratory Information System', 'status' => 'not_connected'],
            ['key' => 'sms', 'name' => 'SMS / Notification Gateway', 'status' => 'not_connected'],
        ]);
    }

    /** GET /admin/ai-models — registered AI models and their roles (FR8/FR9 governance). */
    public function aiModels(): JsonResponse
    {
        return $this->ok([
            ['key' => 'advisor', 'name' => 'Healthcare Advisor (Q&A)', 'human_approval_required' => false, 'diagnoses' => false],
            ['key' => 'triage', 'name' => 'Symptom Triage', 'human_approval_required' => true, 'diagnoses' => false],
            ['key' => 'documentation', 'name' => 'Clinical Documentation Drafting', 'human_approval_required' => true, 'diagnoses' => false],
            ['key' => 'risk', 'name' => 'NEWS2 / Deterioration Risk', 'human_approval_required' => false, 'diagnoses' => false],
        ]);
    }

    private function defaultMatrix(): array
    {
        return [
            'doctor' => ['visits.write', 'prescriptions.write', 'diagnosis.write', 'orders.write'],
            'nurse' => ['vitals.write', 'mar.write', 'triage.write'],
            'reception' => ['patients.write', 'appointments.write', 'visits.create', 'billing.write'],
            'quality' => ['complaints.manage', 'feedback.read', 'quality.dashboard'],
            'director' => ['reports.read', 'quality.dashboard'],
            'admin' => ['*'],
            'emergency' => ['emergency.manage'],
            'patient' => ['self.read', 'feedback.write', 'appointments.request'],
            'family' => ['status.read', 'consent.write'],
        ];
    }
}
