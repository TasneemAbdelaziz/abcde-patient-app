<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ExcelImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImportController extends Controller
{
    public function __construct(private readonly ExcelImportService $importer)
    {
    }

    /**
     * POST /admin/import — upload one or more hospital .xlsx workbooks and dump
     * their data into the system. During first-time setup (no admin user yet)
     * this is open for bootstrapping; afterwards it requires an admin token.
     */
    public function upload(Request $request): JsonResponse
    {
        if (! $this->authorizedToImport($request)) {
            return $this->fail('Only an admin may import data once the system is set up.', 403);
        }

        $request->validate([
            'files' => ['required_without:file', 'array'],
            'files.*' => ['file', 'mimes:xlsx,xls'],
            'file' => ['required_without:files', 'file', 'mimes:xlsx,xls'],
            'provision_accounts' => ['nullable', 'boolean'],
            'password' => ['nullable', 'string'],
        ]);

        $files = $request->file('files', []);
        if ($request->hasFile('file')) {
            $files[] = $request->file('file');
        }

        $summary = [];
        foreach ($files as $file) {
            $summary[$file->getClientOriginalName()] = $this->importer->importFile($file->getRealPath());
        }

        $accounts = null;
        if ($request->boolean('provision_accounts', true)) {
            $accounts = $this->importer->provisionAccounts($request->input('password', 'password'));
        }

        return $this->ok([
            'imported' => $summary,
            'total_rows' => $this->totalRows($summary),
            'accounts' => $accounts,
        ], 'Import complete.');
    }

    /**
     * POST /admin/import/seed — import the bundled workbooks from the repo's
     * db/ directory (handy for first-time setup and demos).
     */
    public function seed(Request $request): JsonResponse
    {
        if (! $this->authorizedToImport($request)) {
            return $this->fail('Only an admin may import data once the system is set up.', 403);
        }

        $dir = $request->input('path', base_path('..' . DIRECTORY_SEPARATOR . 'db'));
        if (! is_dir($dir)) {
            return $this->fail('Data directory not found: :dir', 404, [], ['dir' => $dir]);
        }

        $summary = $this->importer->importDirectory($dir);
        $accounts = $this->importer->provisionAccounts($request->input('password', 'password'));

        return $this->ok([
            'imported' => $summary,
            'total_rows' => array_sum(array_map([$this, 'totalRows'], $summary)),
            'accounts' => $accounts,
        ], 'Seed import complete.');
    }

    /** Bootstrap-friendly authorization: open until an admin exists. */
    private function authorizedToImport(Request $request): bool
    {
        if (User::where('role', 'admin')->doesntExist()) {
            return true;
        }

        $user = $request->user();

        return $user && $user->role === 'admin';
    }

    private function totalRows(array $summary): int
    {
        return array_sum(array_map('array_sum', $summary));
    }
}
