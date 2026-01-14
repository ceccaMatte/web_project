<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crea la tabella time_slots.
     * 
     * Gli slot temporali sono generati automaticamente da ogni working_day
     * e rappresentano gli intervalli prenotabili per gli ordini.
     */
    public function up(): void
    {
        Schema::create('time_slots', function (Blueprint $table) {
            $table->id();
            
            // Riferimento al giorno lavorativo
            $table->foreignId('working_day_id')
                  ->constrained('working_days')
                  ->onDelete('cascade'); // Cancellazione cascata
            
            // Orari dello slot
            $table->time('start_time')->comment('Inizio slot');
            $table->time('end_time')->comment('Fine slot');
            
            $table->timestamps();
            
            // Indici per performance
            $table->index('working_day_id');
            $table->index(['working_day_id', 'start_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('time_slots');
    }
};
