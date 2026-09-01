<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('services', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->text('description')->nullable();
            $table->unsignedSmallInteger('duration'); $table->unsignedInteger('price');
            $table->boolean('active')->default(true); $table->timestamps();
        });
        Schema::create('barbers', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('title')->nullable();
            $table->text('bio')->nullable(); $table->string('avatar')->nullable();
            $table->boolean('active')->default(true); $table->timestamps();
        });
        Schema::create('customers', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('phone')->unique();
            $table->string('email')->nullable(); $table->text('notes')->nullable();
            $table->timestamp('last_visit_at')->nullable(); $table->timestamps();
        });
        Schema::create('bookings', function (Blueprint $table) {
            $table->id(); $table->string('code')->unique();
            $table->foreignId('customer_id')->constrained(); $table->foreignId('service_id')->constrained();
            $table->foreignId('barber_id')->constrained(); $table->dateTime('starts_at'); $table->dateTime('ends_at');
            $table->enum('status', ['pending','confirmed','serving','completed','cancelled','no_show'])->default('pending');
            $table->text('notes')->nullable(); $table->unsignedInteger('total'); $table->timestamps();
            $table->index(['barber_id', 'starts_at', 'ends_at']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('bookings'); Schema::dropIfExists('customers');
        Schema::dropIfExists('barbers'); Schema::dropIfExists('services');
    }
};
