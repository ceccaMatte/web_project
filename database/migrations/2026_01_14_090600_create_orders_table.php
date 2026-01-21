<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->foreignId('time_slot_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->enum('status', [
                'pending',
                'confirmed',
                'ready',
                'picked_up',
                'rejected'
            ])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
