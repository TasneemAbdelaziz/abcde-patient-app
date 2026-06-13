<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Clinical / cardiac data (File 3 — ABCDE_Data_3_Clinical_Cardiac.xlsx):
 * journey timeline, vitals, labs, radiology, ICD-10 diagnoses,
 * prescriptions, MAR administrations, consents & checklists.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Sheet: Journey_Timeline
        Schema::create('journey_timelines', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->string('stage');
            $table->dateTime('entered_at')->nullable();
            $table->string('moved_by_staff_id')->nullable()->index();
            $table->text('decision_note')->nullable();
            $table->timestamps();
        });

        // Sheet: Vitals
        Schema::create('vitals', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->dateTime('taken_at')->nullable();
            $table->string('nurse_id')->nullable()->index();
            $table->integer('systolic_bp')->nullable();
            $table->integer('diastolic_bp')->nullable();
            $table->integer('pulse')->nullable();
            $table->integer('respiratory_rate')->nullable();
            $table->integer('spo2')->nullable();
            $table->decimal('temperature', 4, 1)->nullable();
            $table->integer('pain_score')->nullable(); // 0-10
            $table->string('consciousness_avpu', 1)->nullable(); // A/V/P/U
            $table->integer('news2_score')->nullable(); // computed early-warning score
            $table->string('risk_level')->nullable(); // low/medium/high
            $table->timestamps();
        });

        // Sheet: Lab_Results
        Schema::create('lab_results', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->dateTime('ordered_at')->nullable();
            $table->string('test_name');
            $table->string('result_value')->nullable();
            $table->string('unit')->nullable();
            $table->decimal('normal_range_low', 10, 3)->nullable();
            $table->decimal('normal_range_high', 10, 3)->nullable();
            $table->string('flag', 1)->nullable(); // H/L/N
            $table->dateTime('resulted_at')->nullable();
            $table->timestamps();
        });

        // Sheet: Radiology_Results
        Schema::create('radiology_results', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->dateTime('ordered_at')->nullable();
            $table->string('study');
            $table->dateTime('performed_at')->nullable();
            $table->text('report_summary')->nullable();
            $table->string('reporting_doctor')->nullable();
            $table->timestamps();
        });

        // Sheet: Diagnoses_ICD10
        Schema::create('diagnoses', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->string('icd10_code')->nullable();
            $table->string('diagnosis');
            $table->boolean('is_primary')->default(false);
            $table->string('doctor_id')->nullable()->index();
            $table->timestamps();
        });

        // Sheet: Prescriptions
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->dateTime('prescribed_at')->nullable();
            $table->string('doctor_id')->nullable()->index();
            $table->string('drug_name');
            $table->string('dose')->nullable();
            $table->string('route')->nullable(); // PO/IV/SC/IM
            $table->string('frequency')->nullable();
            $table->integer('duration_days')->nullable();
            $table->text('patient_instructions')->nullable();
            $table->timestamps();
        });

        // Sheet: MAR_Administrations
        Schema::create('mar_administrations', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->foreignId('prescription_id')->nullable()->index();
            $table->string('drug_name');
            $table->dateTime('scheduled_time')->nullable();
            $table->dateTime('actual_time')->nullable();
            $table->string('administered_by')->nullable(); // staff id or 'PATIENT'
            $table->string('action')->nullable(); // given/refused/missed/taken
            $table->text('note')->nullable();
            $table->timestamps();
        });

        // Sheet: Consents_Checklists
        Schema::create('consents_checklists', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->string('record_type'); // consent / preop_checklist / surgical_timeout
            $table->string('item');
            $table->dateTime('requested_at')->nullable();
            $table->string('responded_by')->nullable();
            $table->string('decision')->nullable(); // given/declined/completed
            $table->dateTime('responded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consents_checklists');
        Schema::dropIfExists('mar_administrations');
        Schema::dropIfExists('prescriptions');
        Schema::dropIfExists('diagnoses');
        Schema::dropIfExists('radiology_results');
        Schema::dropIfExists('lab_results');
        Schema::dropIfExists('vitals');
        Schema::dropIfExists('journey_timelines');
    }
};
