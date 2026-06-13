<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Hospital master data (File 1 — ABCDE_Data_1_Hospital_Master.xlsx):
 * departments, staff, locations, drugs, education content, hospital profile.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Sheet: Departments
        Schema::create('departments', function (Blueprint $table) {
            $table->string('dept_code')->primary();
            $table->string('department_name');
            $table->text('description')->nullable();
            $table->boolean('accepts_bookings')->default(false);
            $table->string('head_of_department')->nullable();
            $table->timestamps();
        });

        // Sheet: Doctors_Staff
        Schema::create('staff', function (Blueprint $table) {
            $table->string('staff_id')->primary();
            $table->string('full_name');
            // doctor / nurse / reception / quality / director / admin / emergency
            $table->string('system_role')->index();
            $table->string('dept_code')->nullable()->index();
            $table->string('specialty')->nullable();
            $table->boolean('on_call')->default(false);
            $table->string('phone_extension')->nullable();
            $table->string('work_email')->nullable();
            $table->foreignId('user_id')->nullable()->index();
            $table->timestamps();
        });

        // Sheet: Rooms_Locations
        Schema::create('locations', function (Blueprint $table) {
            $table->string('location_code')->primary();
            $table->string('location_name');
            $table->string('floor')->nullable();
            // er / cath_lab / ward / clinic / icu / reception / lab / radiology
            $table->string('location_type')->nullable()->index();
            $table->boolean('wheelchair_accessible')->default(false);
            $table->timestamps();
        });

        // Sheet: Pharmacy_Drugs
        Schema::create('drugs', function (Blueprint $table) {
            $table->id();
            $table->string('drug_name')->unique();
            $table->string('form')->nullable();
            $table->string('strength')->nullable();
            $table->string('code')->nullable(); // internal_or_ATC_code
            $table->boolean('currently_available')->default(true);
            $table->integer('approx_stock_qty')->nullable();
            $table->boolean('part_of_cardiac_protocol')->default(false);
            $table->timestamps();
        });

        // Sheet: Education_Content
        Schema::create('education_contents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('content_type')->nullable(); // video / article / audio
            $table->string('condition')->nullable();
            $table->string('journey_stage')->nullable();
            $table->integer('duration_min')->nullable();
            $table->string('file_or_link')->nullable();
            $table->string('approved_by')->nullable();
            $table->timestamps();
        });

        // Sheet: Hospital_Profile (key-value)
        Schema::create('hospital_settings', function (Blueprint $table) {
            $table->id();
            $table->string('field')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hospital_settings');
        Schema::dropIfExists('education_contents');
        Schema::dropIfExists('drugs');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('staff');
        Schema::dropIfExists('departments');
    }
};
