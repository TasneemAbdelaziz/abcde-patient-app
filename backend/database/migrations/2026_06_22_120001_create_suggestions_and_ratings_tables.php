<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Patient-facing feedback channels added per the mobile-app requests:
 *  - suggestions: the Development screen's improvement suggestions (S10).
 *  - overall_ratings: the Rate-care → Overall screen (one per patient, upsert).
 *
 * Both are attributed to the patient via the Bearer token, not the request body.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suggestions', function (Blueprint $table) {
            $table->string('suggestion_no')->primary();
            $table->string('patient_serial')->index();
            $table->string('area'); // patient_services/facilities/staff/waiting_time/app_tech/other
            $table->text('suggestion_text');
            $table->string('ticket_no')->nullable()->index();
            $table->string('status')->default('open'); // open/reviewed/closed
            $table->dateTime('submitted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('overall_ratings', function (Blueprint $table) {
            $table->string('rating_no')->primary();
            $table->string('patient_serial')->unique(); // one overall rating per patient (upsert)
            $table->unsignedTinyInteger('stars'); // 1-5
            $table->text('comment')->nullable();
            $table->string('ticket_no')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overall_ratings');
        Schema::dropIfExists('suggestions');
    }
};
