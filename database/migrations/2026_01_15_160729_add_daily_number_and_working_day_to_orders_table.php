<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Aggiunge i campi necessari per il numero ordine giornaliero.
     * 
     * SCELTA ARCHITETTURALE:
     * - Aggiungiamo working_day_id per facilitare le query e l'unique constraint
     * - daily_number è il numero progressivo giornaliero
     * - UNIQUE (working_day_id, daily_number) garantisce unicità per giorno
     * 
     * NOTA: Per gli ordini esistenti, daily_number verrà popolato gradualmente
     * man mano che vengono creati nuovi ordini. Gli ordini esistenti manterranno daily_number null.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Aggiungiamo working_day_id per identificare il giorno dell'ordine
            // Questo campo viene popolato automaticamente dalla relazione time_slot->working_day
            $table->foreignId('working_day_id')
                  ->after('time_slot_id')
                  ->nullable();

            // Numero progressivo giornaliero dell'ordine
            // Si azzera ogni giorno, cresce monotonicamente, non riutilizzato
            $table->unsignedInteger('daily_number')
                  ->after('working_day_id')
                  ->nullable(); // Nullable per ordini esistenti

            // Constraint di unicità: ogni working_day può avere solo un ordine per daily_number
            // Questo garantisce che non ci siano duplicati giornalieri
        });

        // Popoliamo working_day_id per gli ordini esistenti
        // Usiamo una query semplice per aggiornare
        DB::statement('
            UPDATE orders
            SET working_day_id = (
                SELECT working_day_id
                FROM time_slots
                WHERE time_slots.id = orders.time_slot_id
            )
            WHERE working_day_id IS NULL
        ');

        Schema::table('orders', function (Blueprint $table) {
            $table->index('working_day_id', 'orders_working_day_id_index');

            $table->foreign('working_day_id', 'orders_working_day_id_fk')
                ->references('id')
                ->on('working_days')
                ->cascadeOnDelete();

            $table->unique(
                ['working_day_id', 'daily_number'],
                'orders_working_day_daily_number_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     * Rimuoviamo i campi aggiunti.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique('orders_working_day_daily_number_unique');
            $table->dropForeign('orders_working_day_id_fk');
            $table->dropIndex('orders_working_day_id_index');
            $table->dropColumn(['daily_number', 'working_day_id']);
        });
    }
};
