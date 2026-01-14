<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Aggiunge i campi start_time e end_time alla tabella working_days
     * per definire l'orario di lavoro di ogni giorno lavorativo.
     */
    public function up(): void
    {
        Schema::table('working_days', function (Blueprint $table) {
            // Ora di inizio del servizio (es. "08:00")
            $table->time('start_time');

            // Ora di fine del servizio (es. "18:00")
            $table->time('end_time');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Rimuove i campi start_time e end_time dalla tabella working_days.
     */
    public function down(): void
    {
        Schema::table('working_days', function (Blueprint $table) {
            $table->dropColumn(['start_time', 'end_time']);
        });
    }
};
