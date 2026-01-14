<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('working_days', function (Blueprint $table) {
            $table->id();

            // Giorno lavorativo (es. 2026-01-23)
            $table->date('day')->unique();

            // Luogo del servizio (es. "Piazza Centrale")
            $table->string('location');

            // Numero massimo di ordini per slot
            $table->unsignedInteger('max_orders');

            // Minuti prima dello slot oltre i quali l’ordine non è modificabile
            $table->unsignedInteger('max_time');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('working_days');
    }
};
