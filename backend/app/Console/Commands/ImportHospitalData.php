<?php

namespace App\Console\Commands;

use App\Services\ExcelImportService;
use Illuminate\Console\Command;

class ImportHospitalData extends Command
{
    protected $signature = 'abcde:import
        {path? : Path to an .xlsx file or a directory of ABCDE_Data_*.xlsx (defaults to ../db)}
        {--no-accounts : Skip creating login accounts for imported staff/patients}
        {--password=password : Default password for the accounts that get created}';

    protected $description = 'Import the hospital Excel workbooks into the database';

    public function handle(ExcelImportService $importer): int
    {
        $path = $this->argument('path') ?: base_path('..' . DIRECTORY_SEPARATOR . 'db');

        if (! file_exists($path)) {
            $this->error("Path not found: {$path}");

            return self::FAILURE;
        }

        $this->info('Importing from: ' . realpath($path));

        $results = is_dir($path)
            ? $importer->importDirectory($path)
            : [basename($path) => $importer->importFile($path)];

        foreach ($results as $file => $sheets) {
            $this->newLine();
            $this->line("<fg=cyan>{$file}</>");
            if (empty($sheets)) {
                $this->warn('  (no recognised sheets)');
                continue;
            }
            $rows = [];
            foreach ($sheets as $sheet => $count) {
                $rows[] = [$sheet, $count];
            }
            $this->table(['Sheet', 'Rows'], $rows);
        }

        if (! $this->option('no-accounts')) {
            $accounts = $importer->provisionAccounts($this->option('password'));
            $this->newLine();
            $this->info(sprintf(
                'Accounts provisioned — staff: %d, patients: %d, companions: %d (password: "%s")',
                $accounts['staff'],
                $accounts['patients'],
                $accounts['companions'],
                $this->option('password'),
            ));
        }

        $this->newLine();
        $this->info('Import complete.');

        return self::SUCCESS;
    }
}
