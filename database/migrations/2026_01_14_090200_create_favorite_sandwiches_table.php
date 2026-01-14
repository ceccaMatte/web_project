<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Esegue la migration.
     *
     * La tabella favorite_sandwiches rappresenta le configurazioni
     * di panini salvate dagli utenti.
     * Non è un ordine e non contiene informazioni temporali o di stato.
     */
    public function up(): void
    {
        Schema::create('favorite_sandwiches', function (Blueprint $table) {

            // Chiave primaria
            // Identifica univocamente un panino preferito
            $table->id();

            // Utente proprietario del panino preferito
            // Ogni panino preferito appartiene a un solo utente
            // Se l'utente viene eliminato, i suoi panini preferiti
            // vengono eliminati automaticamente
            $table->foreignId('user_id')
                  ->constrained()
                  ->cascadeOnDelete();

            // Timestamp
            // created_at -> quando il panino è stato salvato
            // updated_at -> eventuali modifiche alla configurazione
            $table->timestamps();
        });
    }

    /**
     * Annulla la migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('favorite_sandwiches');
    }
};
