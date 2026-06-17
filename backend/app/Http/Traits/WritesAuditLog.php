<?php

namespace App\Http\Traits;

use App\Models\AuditLog;
use Illuminate\Http\Request;

/**
 * Appends entries to the audit trail (NFR-11). Reusable by any controller that
 * needs to record who did what, when, and from where.
 */
trait WritesAuditLog
{
    /**
     * @param  array<string,mixed>  $changes
     */
    protected function recordAudit(Request $request, string $action, ?string $entityType = null, ?string $entityId = null, array $changes = []): AuditLog
    {
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
}
