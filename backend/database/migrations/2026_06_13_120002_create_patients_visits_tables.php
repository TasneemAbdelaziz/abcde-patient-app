<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Patients & visits (File 2 — ABCDE_Data_2_Patients_Visits.xlsx):
 * patients, insurance coverage, visits, appointments, family companions.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Sheet: Patients
        Schema::create('patients', function (Blueprint $table) {
            $table->string('patient_serial')->primary(); // ALM-#####
            $table->string('national_id')->nullable()->index();
            $table->string('full_name');
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 1)->nullable(); // M / F
            $table->string('phone')->nullable()->index();
            $table->string('city_district')->nullable();
            $table->string('preferred_language', 5)->default('ar'); // ar / en / ru
            $table->string('decision_maker')->nullable();
            $table->text('chronic_conditions')->nullable();
            $table->foreignId('user_id')->nullable()->index();
            $table->timestamps();
        });

        // Sheet: Insurance_Coverage
        Schema::create('insurance_coverages', function (Blueprint $table) {
            $table->id();
            $table->string('patient_serial')->index();
            // insured / employer_paid / uninsured_able / uninsured_unable / state / pension / student
            $table->string('coverage_category');
            $table->string('payer_name')->nullable();
            $table->string('policy_no')->nullable();
            $table->string('determined_from')->nullable(); // national_id / manual
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Sheet: Visits
        Schema::create('visits', function (Blueprint $table) {
            $table->string('ticket_no')->primary(); // #ALM-#####
            $table->string('patient_serial')->index();
            $table->string('arrival_type')->nullable(); // emergency / scheduled / cold / referred
            $table->dateTime('arrived_at')->nullable();
            $table->string('triage_classification')->nullable(); // cold / emergency / critical
            $table->string('dept_code')->nullable()->index();
            $table->string('treating_doctor_id')->nullable()->index();
            $table->string('location_code')->nullable()->index();
            // arrival/triage/diagnosis/cathprep/cath/recovery/ward/discharge/followup
            $table->string('current_stage')->nullable()->index();
            $table->dateTime('door_time')->nullable();
            $table->dateTime('balloon_time')->nullable();
            // cerebral / cardiac / peripheral / interventional_radiology
            $table->string('catheterization_type')->nullable();
            $table->string('visit_status')->default('open'); // open / closed
            $table->timestamps();
        });

        // Sheet: Appointments
        Schema::create('appointments', function (Blueprint $table) {
            $table->string('appointment_id')->primary();
            // Raw value: a serial OR "guest: name / phone"
            $table->string('patient_serial_or_guest')->nullable();
            $table->string('patient_serial')->nullable()->index(); // resolved if registered
            $table->string('dept_code')->nullable()->index();
            $table->text('complaint')->nullable();
            $table->dateTime('requested_at')->nullable();
            $table->dateTime('scheduled_at')->nullable();
            // pending / approved / declined / cancelled / completed
            $table->string('status')->default('pending')->index();
            $table->string('assigned_doctor_id')->nullable()->index();
            $table->timestamps();
        });

        // Sheet: Family_Companions (one companion max per patient)
        Schema::create('family_companions', function (Blueprint $table) {
            $table->id();
            $table->string('patient_serial')->index();
            $table->string('companion_name');
            $table->string('relation')->nullable(); // son/daughter/spouse/parent/sibling
            $table->string('companion_phone')->nullable();
            $table->boolean('can_see_status')->default(false);
            $table->boolean('receives_alerts')->default(false);
            $table->boolean('can_book')->default(false);
            $table->boolean('can_rate')->default(false);
            $table->boolean('can_raise_emergency')->default(false);
            $table->boolean('is_decision_maker')->default(false);
            $table->foreignId('user_id')->nullable()->index();
            $table->dateTime('accepted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_companions');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('visits');
        Schema::dropIfExists('insurance_coverages');
        Schema::dropIfExists('patients');
    }
};
