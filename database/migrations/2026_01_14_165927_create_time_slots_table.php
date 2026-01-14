<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La tabella time_slots rappresenta le fasce orarie
     * appartenenti a un giorno lavorativo.
     */
    public function up(): void
    {
        Schema::create('time_slots', function (Blueprint $table) {

            // Chiave primaria
            $table->id();

            // Giorno lavorativo di appartenenza
            // Se il giorno viene eliminato, anche gli slot spariscono
            $table->foreignId('working_day_id')
                  ->constrained()
                  ->cascadeOnDelete();

            // Orario di inizio dello slot
            $table->time('start_time');

            // Orario di fine dello slot
            $table->time('end_time');

            // Vincolo: uno slot è unico all'interno del giorno
            $table->unique([
                'working_day_id',
                'start_time',
                'end_time'
            ]);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_slots');
    }
};
