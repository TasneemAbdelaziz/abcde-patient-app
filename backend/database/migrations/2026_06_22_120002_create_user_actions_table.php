<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-user "actions" (mobile/watch shortcuts). Each action is bound to an app
 * page/route; the watch activates one (sets last_activated_at) and the mobile
 * app reads the most-recently-activated action to navigate. Scoped per user.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('action_key')->nullable();      // stable id e.g. "action_1"
            $table->string('label');                       // button text
            $table->string('route');                       // app page / route / deep link
            $table->string('icon')->nullable();
            $table->json('payload')->nullable();           // optional route params
            $table->integer('position')->default(0);       // ordering
            $table->dateTime('last_activated_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'last_activated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_actions');
    }
};
