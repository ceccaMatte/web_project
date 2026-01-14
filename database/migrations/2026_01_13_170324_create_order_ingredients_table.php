<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La tabella order_ingredients rappresenta lo snapshot
     * degli ingredienti di un ordine nel momento della conferma.
     */
    public function up(): void
    {
        Schema::create('order_ingredients', function (Blueprint $table) {

            $table->id();

            // Ordine di appartenenza
            // Se l'ordine viene eliminato, anche lo snapshot sparisce
            $table->foreignId('order_id')
                  ->constrained()
                  ->cascadeOnDelete();

            // Nome dell'ingrediente al momento dell'ordine
            // Snapshot testuale per preservare lo storico
            $table->string('ingredient_name');

            // Categoria dell'ingrediente al momento dell'ordine
            $table->enum('ingredient_category', [
                'bread',
                'meat',
                'cheese',
                'vegetable',
                'sauce',
                'other'
            ]);

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_ingredients');
    }
};
