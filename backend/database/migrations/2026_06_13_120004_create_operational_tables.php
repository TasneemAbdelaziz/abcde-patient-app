<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Operational & quality data (File 4 — ABCDE_Data_4_Operational_Quality.xlsx):
 * feedback ratings, complaints, emergency/SOS log, monthly KPIs, billing items.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Sheet: Feedback_Ratings
        Schema::create('feedback_ratings', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->string('stage')->nullable();
            $table->string('rated_by')->nullable(); // patient / family
            $table->unsignedTinyInteger('stars'); // 1-5
            $table->text('comment')->nullable();
            $table->dateTime('rated_at')->nullable();
            $table->timestamps();
        });

        // Sheet: Complaints
        Schema::create('complaints', function (Blueprint $table) {
            $table->string('complaint_no')->primary();
            $table->string('ticket_no')->nullable()->index();
            $table->dateTime('submitted_at')->nullable();
            $table->string('stage')->nullable();
            $table->text('complaint_text');
            $table->string('routed_to_dept')->nullable();
            $table->dateTime('responded_at')->nullable();
            $table->string('status')->default('open'); // open/responded/escalated/closed
            $table->timestamps();
        });

        // Sheet: Emergency_SOS_Log
        Schema::create('emergency_sos_logs', function (Blueprint $table) {
            $table->string('event_id')->primary();
            $table->string('event_type'); // sos / code_blue
            $table->string('ticket_no')->nullable()->index();
            $table->string('triggered_by')->nullable(); // patient / family / nurse
            $table->dateTime('started_at')->nullable();
            $table->dateTime('physician_alerted_at')->nullable();
            $table->dateTime('nursing_alerted_at')->nullable();
            $table->dateTime('family_alerted_at')->nullable();
            $table->string('answered_by')->nullable();
            $table->dateTime('resolved_at')->nullable();
            $table->string('classification')->nullable(); // real_emergency / heads_up
            $table->timestamps();
        });

        // Sheet: KPI_Monthly
        Schema::create('kpi_monthly', function (Blueprint $table) {
            $table->id();
            $table->string('month')->unique(); // YYYY-MM
            $table->integer('avg_door_to_balloon_min')->nullable();
            $table->integer('cardiac_cases_count')->nullable();
            $table->decimal('avg_satisfaction', 3, 1)->nullable();
            $table->integer('complaints_count')->nullable();
            $table->integer('complaints_answered_within_6h_pct')->nullable();
            $table->integer('avg_sos_response_seconds')->nullable();
            $table->timestamps();
        });

        // Sheet: Billing_Items
        Schema::create('billing_items', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->string('item_description');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price_egp', 10, 2)->nullable();
            $table->boolean('covered_by_insurance')->default(false);
            $table->string('payment_method')->nullable(); // cash/card/wallet/state
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_items');
        Schema::dropIfExists('kpi_monthly');
        Schema::dropIfExists('emergency_sos_logs');
        Schema::dropIfExists('complaints');
        Schema::dropIfExists('feedback_ratings');
    }
};
