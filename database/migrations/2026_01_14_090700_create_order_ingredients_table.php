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
            // IMPORTANTE: questo è uno SNAPSHOT, non una relazione live
            // Se l'ingrediente viene rinominato o eliminato in futuro,
            // questo valore resta immutato per preservare lo storico
            $table->string('name');

            // Categoria dell'ingrediente al momento dell'ordine
            // Anche la categoria è uno snapshot
            $table->enum('category', [
                'bread',
                'meat',
                'cheese',
                'vegetable',
                'sauce',
                'other'
            ]);

            // NON esiste un timestamp su questa tabella
            // perché usa i timestamp dell'ordine padre

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_ingredients');
    }
};
