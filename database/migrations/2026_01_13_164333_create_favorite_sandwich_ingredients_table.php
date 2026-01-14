<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Esegue la migration.
     *
     * Questa tabella rappresenta la relazione tra panini preferiti
     * e ingredienti.
     * È una tabella pivot pura, senza logica di dominio propria.
     */
    public function up(): void
    {
        Schema::create('favorite_sandwich_ingredients', function (Blueprint $table) {

            // Chiave primaria tecnica
            // Non strettamente necessaria, ma utile per estensioni future
            $table->id();

            // Riferimento al panino preferito
            // Se il panino viene eliminato, la relazione viene eliminata
            $table->foreignId('favorite_sandwich_id')
                  ->constrained()
                  ->cascadeOnDelete();

            // Riferimento all'ingrediente
            // Se l'ingrediente viene eliminato, la relazione viene eliminata
            $table->foreignId('ingredient_id')
                  ->constrained()
                  ->cascadeOnDelete();

            // Vincolo di unicità
            // Evita di inserire lo stesso ingrediente due volte
            // nello stesso panino preferito
            $table->unique(
                ['favorite_sandwich_id', 'ingredient_id'],
                'fav_sand_ing_unique'
            );
        });
    }

    /**
     * Annulla la migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('favorite_sandwich_ingredients');
    }
};
