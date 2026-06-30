<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Push (FCM) device tokens. Each phone that signs in registers its token here
 * (POST /me/devices) bound to the current user. The watch later asks the server
 * to wake a screen on that phone (POST /remote/open), which fans the message out
 * to every device row of the *same* user — that shared user id is the entire
 * pairing mechanism (no separate pairing step). `fcm_token` is unique so a
 * re-registered token simply re-points at its new owner.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('fcm_token')->unique();          // the phone's FCM registration token
            $table->string('platform')->nullable();         // android | ios | web
            $table->timestamps();
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_tokens');
    }
};
