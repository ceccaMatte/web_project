<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('working_day_id')
                  ->constrained('working_days')
                  ->onDelete('cascade');
            $table->time('start_time')->comment('Inizio slot');
            $table->time('end_time')->comment('Fine slot');
            $table->timestamps();
            $table->index('working_day_id');
            $table->index(['working_day_id', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_slots');
    }
};
