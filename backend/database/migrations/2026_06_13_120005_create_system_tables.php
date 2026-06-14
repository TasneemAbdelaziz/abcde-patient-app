<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * System / application tables that back the write-side APIs and are not part of
 * the seed spreadsheets: notifications, care points, accessibility, ID cards,
 * doctor's orders, care plans, consultations, AI documentation drafts,
 * payments, committee reviews, transport forms, and the audit log.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('patient_serial')->nullable()->index();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('type')->nullable(); // alert/reminder/update/stage_change/sos
            $table->string('title');
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('care_points', function (Blueprint $table) {
            $table->id();
            $table->string('patient_serial')->index();
            $table->integer('points');
            $table->string('reason')->nullable();
            $table->string('source_type')->nullable(); // rating/feedback/...
            $table->string('source_id')->nullable();
            $table->timestamps();
        });

        Schema::create('accessibility_settings', function (Blueprint $table) {
            $table->id();
            $table->string('patient_serial')->unique();
            $table->boolean('high_contrast')->default(false);
            $table->boolean('screen_reader')->default(false);
            $table->boolean('text_to_speech')->default(false);
            $table->boolean('captions')->default(false);
            $table->boolean('haptics')->default(false);
            $table->boolean('simple_mode')->default(false);
            $table->decimal('font_scale', 3, 1)->default(1.0);
            $table->json('extra')->nullable();
            $table->timestamps();
        });

        Schema::create('patient_cards', function (Blueprint $table) {
            $table->id();
            $table->string('patient_serial')->index();
            $table->string('card_type'); // arrival / booking
            $table->string('barcode')->unique();
            $table->string('qr_token')->nullable()->unique();
            $table->string('issued_by')->nullable();
            $table->dateTime('issued_at')->nullable();
            $table->timestamps();
        });

        // Doctor's orders (lab/radiology/medication/diet/imaging) — FR7.3
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->string('order_type'); // lab/radiology/medication/diet/imaging
            $table->text('detail')->nullable();
            $table->string('status')->default('ordered'); // ordered/in_progress/resulted/cancelled
            $table->string('ordered_by')->nullable();
            $table->dateTime('ordered_at')->nullable();
            $table->text('result_summary')->nullable();
            $table->dateTime('resulted_at')->nullable();
            $table->timestamps();
        });

        // Care plan — FR4.6.1
        Schema::create('care_plans', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->text('problem_list')->nullable();
            $table->text('plan')->nullable();
            $table->text('outcomes')->nullable();
            $table->string('timeframe')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
        });

        // Consultation requests — FR7.3.2
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->string('specialty')->nullable();
            $table->text('question')->nullable();
            $table->text('reply')->nullable();
            $table->string('requested_by')->nullable();
            $table->string('answered_by')->nullable();
            $table->string('status')->default('open'); // open/answered
            $table->timestamps();
        });

        // AI documentation drafts — FR9 (human approval required before saving)
        Schema::create('documentation_drafts', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->nullable()->index();
            $table->string('doc_type')->nullable(); // discharge_summary/report/note
            $table->text('content')->nullable();
            $table->string('status')->default('draft'); // draft/approved
            $table->string('created_by')->nullable();
            $table->string('approved_by')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->timestamps();
        });

        // Payments — FR13
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->decimal('amount', 10, 2);
            $table->string('method')->nullable(); // cash/card/wallet/state
            $table->string('status')->default('paid'); // paid/pending/refunded
            $table->string('reference')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
        });

        // Three-doctor / funding committee reviews — FR4.4.3 & FR13
        Schema::create('committee_reviews', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->string('review_type')->default('funding'); // funding/direct_admission
            $table->text('reason')->nullable();
            $table->json('members')->nullable();
            $table->string('decision')->nullable(); // authorized/declined/pending
            $table->text('memo')->nullable();
            $table->string('decided_by')->nullable();
            $table->dateTime('decided_at')->nullable();
            $table->timestamps();
        });

        // Internal transport safety forms (RSTP) — FR4.6.2
        Schema::create('transport_forms', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_no')->index();
            $table->string('from_location')->nullable();
            $table->string('to_location')->nullable();
            $table->json('monitoring')->nullable();
            $table->string('escorted_by')->nullable();
            $table->dateTime('transported_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('actor')->nullable();
            $table->string('action');
            $table->string('entity_type')->nullable();
            $table->string('entity_id')->nullable();
            $table->json('changes')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('transport_forms');
        Schema::dropIfExists('committee_reviews');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('documentation_drafts');
        Schema::dropIfExists('consultations');
        Schema::dropIfExists('care_plans');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('patient_cards');
        Schema::dropIfExists('accessibility_settings');
        Schema::dropIfExists('care_points');
        Schema::dropIfExists('notifications');
    }
};
