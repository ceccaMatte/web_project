<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La tabella orders rappresenta gli ordini effettuati dagli utenti.
     * Ogni ordine è legato a un time slot e contiene uno snapshot del panino.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {

            $table->id();

            // Utente che ha effettuato l'ordine
            $table->foreignId('user_id')
                  ->constrained()
                  ->cascadeOnDelete();

            // Slot orario scelto
            $table->foreignId('time_slot_id')
                  ->constrained()
                  ->cascadeOnDelete();

            // Stato dell'ordine
            // Può avanzare o retrocedere in base alle azioni dell'admin
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
