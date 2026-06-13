<?php

namespace App\Services;

use App\Models;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Imports the hospital-supplied Excel workbooks (db/ABCDE_Data_*.xlsx) into the
 * relational schema. Each sheet is matched by title to a mapping that declares
 * the target model, the natural key used for idempotent upserts, and how each
 * column maps to a model attribute (with type coercion).
 *
 * Every data sheet follows the same layout: row 1 = headers, row 2 = the
 * hospital's instruction/description row (skipped), data from row 3 onward.
 */
class ExcelImportService
{
    /** Cell tokens that mean "no value" (incl. the mojibaked em-dash). */
    private const NULL_TOKENS = ['', '-', '—', '–', '�', 'n/a', 'na', 'none'];

    /**
     * Import every recognised sheet inside a single .xlsx file.
     *
     * @return array<string,int> sheet title => rows imported
     */
    public function importFile(string $path): array
    {
        $reader = IOFactory::createReaderForFile($path);
        $reader->setReadDataOnly(false); // keep cell formats so we can detect dates
        $spreadsheet = $reader->load($path);

        $map = $this->sheetMap();
        $summary = [];

        DB::transaction(function () use ($spreadsheet, $map, &$summary) {
            foreach ($spreadsheet->getAllSheets() as $sheet) {
                $title = $sheet->getTitle();
                if (! isset($map[$title])) {
                    continue; // e.g. "Data Request" tabs and the progress tracker
                }
                $summary[$title] = $this->importSheet($sheet, $map[$title]);
            }
        });

        $spreadsheet->disconnectWorksheets();
        unset($spreadsheet);

        return $summary;
    }

    /**
     * Import all hospital data workbooks found in a directory.
     *
     * @return array<string,array<string,int>> file name => sheet summary
     */
    public function importDirectory(string $dir): array
    {
        $results = [];
        foreach (glob(rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . 'ABCDE_Data_*.xlsx') as $file) {
            $results[basename($file)] = $this->importFile($file);
        }

        return $results;
    }

    /** Import a single worksheet according to its mapping config. */
    private function importSheet(Worksheet $sheet, array $config): int
    {
        $headers = $this->readHeaders($sheet);
        $startRow = 2 + ($config['skip_description'] ?? true ? 1 : 0); // skip header + instruction row
        $lastRow = $sheet->getHighestDataRow();
        $count = 0;

        for ($row = $startRow; $row <= $lastRow; $row++) {
            $values = $this->readRow($sheet, $headers, $config['map'], $row);

            if ($this->isEmptyRow($values, $config['keys'])) {
                continue;
            }

            if (isset($config['transform'])) {
                $values = $config['transform']($values, $this);
            }

            $keys = [];
            foreach ($config['keys'] as $keyField) {
                $keys[$keyField] = $values[$keyField] ?? null;
            }
            $attributes = array_diff_key($values, $keys);

            /** @var class-string<\Illuminate\Database\Eloquent\Model> $model */
            $model = $config['model'];
            $model::updateOrCreate($keys, $attributes);
            $count++;
        }

        return $count;
    }

    /** @return array<string,string> column letter => normalised header */
    private function readHeaders(Worksheet $sheet): array
    {
        $headers = [];
        $highestColumn = $sheet->getHighestDataColumn(1);
        foreach ($sheet->getRowIterator(1, 1) as $rowObj) {
            $cellIterator = $rowObj->getCellIterator('A', $highestColumn);
            $cellIterator->setIterateOnlyExistingCells(false);
            foreach ($cellIterator as $cell) {
                $raw = trim((string) $cell->getValue());
                if ($raw !== '') {
                    $headers[$cell->getColumn()] = $this->normalizeHeader($raw);
                }
            }
        }

        return $headers;
    }

    /**
     * Build a model-attribute array for one data row.
     *
     * @param  array<string,string>  $headers  column letter => normalised header
     * @param  array<string,array{attr:string,type:string}>  $map  header => mapping
     * @return array<string,mixed>
     */
    private function readRow(Worksheet $sheet, array $headers, array $map, int $row): array
    {
        $values = [];
        foreach ($headers as $col => $header) {
            if (! isset($map[$header])) {
                continue;
            }
            $cell = $sheet->getCell($col . $row);
            $values[$map[$header]['attr']] = $this->cast($cell, $map[$header]['type']);
        }

        return $values;
    }

    private function isEmptyRow(array $values, array $keys): bool
    {
        foreach ($keys as $keyField) {
            if (! empty($values[$keyField])) {
                return false;
            }
        }

        return true;
    }

    /** Normalise a spreadsheet header into a lookup key. */
    public function normalizeHeader(string $header): string
    {
        $header = preg_replace('/\([^)]*\)/', '', $header); // drop "(Y/N)", "(fictitious)", ...
        $header = strtolower(trim($header));

        return preg_replace('/[^a-z0-9]+/', '_', $header);
    }

    /** Coerce a cell value to the target type, treating null tokens as null. */
    private function cast(Cell $cell, string $type): mixed
    {
        $raw = $cell->getValue();

        if (in_array($type, ['date', 'datetime'], true)) {
            return $this->toDateTime($cell, $type);
        }

        if (is_string($raw)) {
            $raw = trim($raw);
            if (in_array(mb_strtolower($raw), self::NULL_TOKENS, true)) {
                return null;
            }
        }
        if ($raw === null) {
            return null;
        }

        return match ($type) {
            'int' => (int) $raw,
            'float' => is_numeric($raw) ? (float) $raw : null,
            'bool' => $this->toBool($raw),
            default => (string) $raw,
        };
    }

    private function toBool(mixed $raw): ?bool
    {
        $v = mb_strtolower(trim((string) $raw));
        if (in_array($v, ['y', 'yes', 'true', '1'], true)) {
            return true;
        }
        if (in_array($v, ['n', 'no', 'false', '0'], true)) {
            return false;
        }

        return null;
    }

    private function toDateTime(Cell $cell, string $type): ?string
    {
        $raw = $cell->getValue();
        if ($raw === null || $raw === '') {
            return null;
        }

        // Real Excel date cell (numeric serial with a date format applied).
        if (is_numeric($raw) && ExcelDate::isDateTime($cell)) {
            $dt = Carbon::instance(ExcelDate::excelToDateTimeObject((float) $raw));

            return $type === 'date' ? $dt->toDateString() : $dt->toDateTimeString();
        }

        $raw = trim((string) $raw);
        if (in_array(mb_strtolower($raw), self::NULL_TOKENS, true)) {
            return null;
        }

        try {
            $dt = Carbon::parse($raw);
        } catch (\Throwable) {
            return null;
        }

        return $type === 'date' ? $dt->toDateString() : $dt->toDateTimeString();
    }

    /**
     * Create login accounts for imported staff, patients and companions so the
     * seeded system is immediately usable. Idempotent.
     *
     * @return array<string,int>
     */
    public function provisionAccounts(string $password = 'password'): array
    {
        $hash = Hash::make($password);
        $created = ['staff' => 0, 'patients' => 0, 'companions' => 0];

        foreach (Models\Staff::whereNull('user_id')->get() as $staff) {
            $user = Models\User::firstOrCreate(
                ['username' => $staff->work_email ?: Str::lower($staff->staff_id)],
                [
                    'name' => $staff->full_name,
                    'email' => $staff->work_email,
                    'role' => $staff->system_role,
                    'staff_id' => $staff->staff_id,
                    'password' => $hash,
                    'locale' => 'en',
                ]
            );
            $staff->update(['user_id' => $user->id]);
            $created['staff']++;
        }

        foreach (Models\Patient::whereNull('user_id')->get() as $patient) {
            $user = Models\User::firstOrCreate(
                ['username' => $patient->phone ?: $patient->patient_serial],
                [
                    'name' => $patient->full_name,
                    'role' => 'patient',
                    'patient_serial' => $patient->patient_serial,
                    'password' => $hash,
                    'locale' => $patient->preferred_language ?: 'ar',
                ]
            );
            $patient->update(['user_id' => $user->id]);
            $created['patients']++;
        }

        foreach (Models\FamilyCompanion::whereNull('user_id')->get() as $companion) {
            if (! $companion->companion_phone) {
                continue;
            }
            $user = Models\User::firstOrCreate(
                ['username' => $companion->companion_phone],
                [
                    'name' => $companion->companion_name,
                    'role' => 'family',
                    'patient_serial' => $companion->patient_serial,
                    'password' => $hash,
                    'locale' => 'ar',
                ]
            );
            $companion->update(['user_id' => $user->id, 'accepted_at' => now()]);
            $created['companions']++;
        }

        return $created;
    }

    /**
     * The full sheet → model mapping. Keys are the exact worksheet titles.
     *
     * @return array<string,array{model:class-string,keys:array<int,string>,map:array<string,array{attr:string,type:string}>,transform?:callable,skip_description?:bool}>
     */
    private function sheetMap(): array
    {
        $s = fn (string $attr) => ['attr' => $attr, 'type' => 'string'];
        $i = fn (string $attr) => ['attr' => $attr, 'type' => 'int'];
        $f = fn (string $attr) => ['attr' => $attr, 'type' => 'float'];
        $b = fn (string $attr) => ['attr' => $attr, 'type' => 'bool'];
        $d = fn (string $attr) => ['attr' => $attr, 'type' => 'date'];
        $dt = fn (string $attr) => ['attr' => $attr, 'type' => 'datetime'];

        return [
            // ---- File 1: Hospital Master ----
            'Hospital_Profile' => [
                'model' => Models\HospitalSetting::class,
                'keys' => ['field'],
                'map' => ['field' => $s('field'), 'value' => $s('value')],
            ],
            'Departments' => [
                'model' => Models\Department::class,
                'keys' => ['dept_code'],
                'map' => [
                    'dept_code' => $s('dept_code'),
                    'department_name' => $s('department_name'),
                    'description' => $s('description'),
                    'accepts_bookings' => $b('accepts_bookings'),
                    'head_of_department' => $s('head_of_department'),
                ],
            ],
            'Doctors_Staff' => [
                'model' => Models\Staff::class,
                'keys' => ['staff_id'],
                'map' => [
                    'staff_id' => $s('staff_id'),
                    'full_name' => $s('full_name'),
                    'system_role' => $s('system_role'),
                    'dept_code' => $s('dept_code'),
                    'specialty' => $s('specialty'),
                    'on_call' => $b('on_call'),
                    'phone_extension' => $s('phone_extension'),
                    'work_email' => $s('work_email'),
                ],
            ],
            'Rooms_Locations' => [
                'model' => Models\Location::class,
                'keys' => ['location_code'],
                'map' => [
                    'location_code' => $s('location_code'),
                    'location_name' => $s('location_name'),
                    'floor' => $s('floor'),
                    'location_type' => $s('location_type'),
                    'wheelchair_accessible' => $b('wheelchair_accessible'),
                ],
            ],
            'Pharmacy_Drugs' => [
                'model' => Models\Drug::class,
                'keys' => ['drug_name'],
                'map' => [
                    'drug_name' => $s('drug_name'),
                    'form' => $s('form'),
                    'strength' => $s('strength'),
                    'internal_or_atc_code' => $s('code'),
                    'currently_available' => $b('currently_available'),
                    'approx_stock_qty' => $i('approx_stock_qty'),
                    'part_of_cardiac_protocol' => $b('part_of_cardiac_protocol'),
                ],
            ],
            'Education_Content' => [
                'model' => Models\EducationContent::class,
                'keys' => ['title'],
                'map' => [
                    'title' => $s('title'),
                    'content_type' => $s('content_type'),
                    'condition' => $s('condition'),
                    'journey_stage' => $s('journey_stage'),
                    'duration_min' => $i('duration_min'),
                    'file_or_link' => $s('file_or_link'),
                    'approved_by' => $s('approved_by'),
                ],
            ],

            // ---- File 2: Patients & Visits ----
            'Patients' => [
                'model' => Models\Patient::class,
                'keys' => ['patient_serial'],
                'map' => [
                    'patient_serial' => $s('patient_serial'),
                    'national_id' => $s('national_id'),
                    'full_name' => $s('full_name'),
                    'date_of_birth' => $d('date_of_birth'),
                    'gender' => $s('gender'),
                    'phone' => $s('phone'),
                    'city_district' => $s('city_district'),
                    'preferred_language' => $s('preferred_language'),
                    'decision_maker' => $s('decision_maker'),
                    'chronic_conditions' => $s('chronic_conditions'),
                ],
            ],
            'Insurance_Coverage' => [
                'model' => Models\InsuranceCoverage::class,
                'keys' => ['patient_serial'],
                'map' => [
                    'patient_serial' => $s('patient_serial'),
                    'coverage_category' => $s('coverage_category'),
                    'payer_name' => $s('payer_name'),
                    'policy_no' => $s('policy_no'),
                    'determined_from' => $s('determined_from'),
                    'notes' => $s('notes'),
                ],
            ],
            'Visits' => [
                'model' => Models\Visit::class,
                'keys' => ['ticket_no'],
                'map' => [
                    'ticket_no' => $s('ticket_no'),
                    'patient_serial' => $s('patient_serial'),
                    'arrival_type' => $s('arrival_type'),
                    'arrived_at' => $dt('arrived_at'),
                    'triage_classification' => $s('triage_classification'),
                    'dept_code' => $s('dept_code'),
                    'treating_doctor_id' => $s('treating_doctor_id'),
                    'location_code' => $s('location_code'),
                    'current_stage' => $s('current_stage'),
                    'door_time' => $dt('door_time'),
                    'balloon_time' => $dt('balloon_time'),
                    'catheterization_type' => $s('catheterization_type'),
                    'visit_status' => $s('visit_status'),
                ],
            ],
            'Appointments' => [
                'model' => Models\Appointment::class,
                'keys' => ['appointment_id'],
                'map' => [
                    'appointment_id' => $s('appointment_id'),
                    'patient_serial_or_guest' => $s('patient_serial_or_guest'),
                    'dept_code' => $s('dept_code'),
                    'complaint' => $s('complaint'),
                    'requested_at' => $dt('requested_at'),
                    'scheduled_at' => $dt('scheduled_at'),
                    'status' => $s('status'),
                    'assigned_doctor_id' => $s('assigned_doctor_id'),
                ],
                'transform' => function (array $v): array {
                    $raw = (string) ($v['patient_serial_or_guest'] ?? '');
                    $v['patient_serial'] = str_starts_with($raw, 'guest:') ? null : ($raw ?: null);

                    return $v;
                },
            ],
            'Family_Companions' => [
                'model' => Models\FamilyCompanion::class,
                'keys' => ['patient_serial'],
                'map' => [
                    'patient_serial' => $s('patient_serial'),
                    'companion_name' => $s('companion_name'),
                    'relation' => $s('relation'),
                    'companion_phone' => $s('companion_phone'),
                    'can_see_status' => $b('can_see_status'),
                    'receives_alerts' => $b('receives_alerts'),
                    'can_book' => $b('can_book'),
                    'can_rate' => $b('can_rate'),
                    'can_raise_emergency' => $b('can_raise_emergency'),
                    'is_decision_maker' => $b('is_decision_maker'),
                ],
            ],

            // ---- File 3: Clinical / Cardiac ----
            'Journey_Timeline' => [
                'model' => Models\JourneyTimeline::class,
                'keys' => ['ticket_no', 'stage', 'entered_at'],
                'map' => [
                    'ticket_no' => $s('ticket_no'),
                    'stage' => $s('stage'),
                    'entered_at' => $dt('entered_at'),
                    'moved_by_staff_id' => $s('moved_by_staff_id'),
                    'decision_note' => $s('decision_note'),
                ],
            ],
            'Vitals' => [
                'model' => Models\Vital::class,
                'keys' => ['ticket_no', 'taken_at'],
                'map' => [
                    'ticket_no' => $s('ticket_no'),
                    'taken_at' => $dt('taken_at'),
                    'nurse_id' => $s('nurse_id'),
                    'systolic_bp_mmhg' => $i('systolic_bp'),
                    'diastolic_bp_mmhg' => $i('diastolic_bp'),
                    'pulse_bpm' => $i('pulse'),
                    'respiratory_rate' => $i('respiratory_rate'),
                    'spo2_percent' => $i('spo2'),
                    'temperature_c' => $f('temperature'),
                    'pain_score_0_10' => $i('pain_score'),
                    'consciousness_avpu' => $s('consciousness_avpu'),
                ],
            ],
            'Lab_Results' => [
                'model' => Models\LabResult::class,
                'keys' => ['ticket_no', 'test_name', 'ordered_at'],
                'map' => [
                    'ticket_no' => $s('ticket_no'),
                    'ordered_at' => $dt('ordered_at'),
                    'test_name' => $s('test_name'),
                    'result_value' => $s('result_value'),
                    'unit' => $s('unit'),
                    'normal_range_low' => $f('normal_range_low'),
                    'normal_range_high' => $f('normal_range_high'),
                    'flag' => $s('flag'),
                    'resulted_at' => $dt('resulted_at'),
                ],
            ],
            'Radiology_Results' => [
                'model' => Models\RadiologyResult::class,
                'keys' => ['ticket_no', 'study', 'ordered_at'],
                'map' => [
                    'ticket_no' => $s('ticket_no'),
                    'ordered_at' => $dt('ordered_at'),
                    'study' => $s('study'),
                    'performed_at' => $dt('performed_at'),
                    'report_summary' => $s('report_summary'),
                    'reporting_doctor' => $s('reporting_doctor'),
                ],
            ],
            'Diagnoses_ICD10' => [
                'model' => Models\Diagnosis::class,
                'keys' => ['ticket_no', 'icd10_code'],
                'map' => [
                    'ticket_no' => $s('ticket_no'),
                    'icd10_code' => $s('icd10_code'),
                    'diagnosis' => $s('diagnosis'),
                    'primary' => $b('is_primary'),
                    'doctor_id' => $s('doctor_id'),
                ],
            ],
            'Prescriptions' => [
                'model' => Models\Prescription::class,
                'keys' => ['ticket_no', 'drug_name', 'prescribed_at'],
                'map' => [
                    'ticket_no' => $s('ticket_no'),
                    'prescribed_at' => $dt('prescribed_at'),
                    'doctor_id' => $s('doctor_id'),
                    'drug_name' => $s('drug_name'),
                    'dose' => $s('dose'),
                    'route' => $s('route'),
                    'frequency' => $s('frequency'),
                    'duration_days' => $i('duration_days'),
                    'patient_instructions' => $s('patient_instructions'),
                ],
            ],
            'MAR_Administrations' => [
                'model' => Models\MarAdministration::class,
                'keys' => ['ticket_no', 'drug_name', 'scheduled_time'],
                'map' => [
                    'ticket_no' => $s('ticket_no'),
                    'drug_name' => $s('drug_name'),
                    'scheduled_time' => $dt('scheduled_time'),
                    'actual_time' => $dt('actual_time'),
                    'administered_by' => $s('administered_by'),
                    'action' => $s('action'),
                    'note' => $s('note'),
                ],
                'transform' => function (array $v): array {
                    // Best-effort link to the originating prescription.
                    $rx = Models\Prescription::where('ticket_no', $v['ticket_no'] ?? null)
                        ->where('drug_name', $v['drug_name'] ?? null)
                        ->first();
                    $v['prescription_id'] = $rx?->id;

                    return $v;
                },
            ],
            'Consents_Checklists' => [
                'model' => Models\ConsentChecklist::class,
                'keys' => ['ticket_no', 'record_type', 'item', 'requested_at'],
                'map' => [
                    'ticket_no' => $s('ticket_no'),
                    'record_type' => $s('record_type'),
                    'item' => $s('item'),
                    'requested_at' => $dt('requested_at'),
                    'responded_by' => $s('responded_by'),
                    'decision' => $s('decision'),
                    'responded_at' => $dt('responded_at'),
                ],
            ],

            // ---- File 4: Operational & Quality ----
            'Feedback_Ratings' => [
                'model' => Models\FeedbackRating::class,
                'keys' => ['ticket_no', 'stage', 'rated_by', 'rated_at'],
                'map' => [
                    'ticket_no' => $s('ticket_no'),
                    'stage' => $s('stage'),
                    'rated_by' => $s('rated_by'),
                    'stars_1_5' => $i('stars'),
                    'comment' => $s('comment'),
                    'rated_at' => $dt('rated_at'),
                ],
            ],
            'Complaints' => [
                'model' => Models\Complaint::class,
                'keys' => ['complaint_no'],
                'map' => [
                    'complaint_no' => $s('complaint_no'),
                    'ticket_no' => $s('ticket_no'),
                    'submitted_at' => $dt('submitted_at'),
                    'stage' => $s('stage'),
                    'complaint_text' => $s('complaint_text'),
                    'routed_to_dept' => $s('routed_to_dept'),
                    'responded_at' => $dt('responded_at'),
                    'status' => $s('status'),
                ],
            ],
            'Emergency_SOS_Log' => [
                'model' => Models\EmergencySosLog::class,
                'keys' => ['event_id'],
                'map' => [
                    'event_id' => $s('event_id'),
                    'event_type' => $s('event_type'),
                    'ticket_no' => $s('ticket_no'),
                    'triggered_by' => $s('triggered_by'),
                    'started_at' => $dt('started_at'),
                    'physician_alerted_at' => $dt('physician_alerted_at'),
                    'nursing_alerted_at' => $dt('nursing_alerted_at'),
                    'family_alerted_at' => $dt('family_alerted_at'),
                    'answered_by' => $s('answered_by'),
                    'resolved_at' => $dt('resolved_at'),
                    'classification' => $s('classification'),
                ],
            ],
            'KPI_Monthly' => [
                'model' => Models\KpiMonthly::class,
                'keys' => ['month'],
                'map' => [
                    'month' => $s('month'),
                    'avg_door_to_balloon_min' => $i('avg_door_to_balloon_min'),
                    'cardiac_cases_count' => $i('cardiac_cases_count'),
                    'avg_satisfaction_1_5' => $f('avg_satisfaction'),
                    'complaints_count' => $i('complaints_count'),
                    'complaints_answered_within_6h_pct' => $i('complaints_answered_within_6h_pct'),
                    'avg_sos_response_seconds' => $i('avg_sos_response_seconds'),
                ],
            ],
            'Billing_Items' => [
                'model' => Models\BillingItem::class,
                'keys' => ['ticket_no', 'item_description', 'paid_at'],
                'map' => [
                    'ticket_no' => $s('ticket_no'),
                    'item_description' => $s('item_description'),
                    'quantity' => $i('quantity'),
                    'unit_price_egp' => $f('unit_price_egp'),
                    'covered_by_insurance' => $b('covered_by_insurance'),
                    'payment_method' => $s('payment_method'),
                    'paid_at' => $dt('paid_at'),
                ],
            ],
        ];
    }
}
