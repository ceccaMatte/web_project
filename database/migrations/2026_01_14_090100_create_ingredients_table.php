<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Esegue la migration.
     *
     * La tabella ingredients rappresenta gli ingredienti disponibili
     * per la composizione dei panini.
     * È una tabella di dominio "atomica", gestita dall'admin.
     */
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {

            // Chiave primaria
            // Identificatore univoco dell'ingrediente
            $table->id();

            // Nome esteso dell'ingrediente
            // Usato nell'interfaccia utente
            // Esempio: "Mozzarella di bufala"
            $table->string('name');

            // Sigla operativa
            // Usata internamente dall'operatore
            // Esempio: "MOZ_BUF"
            $table->string('code');

            // Categoria dell'ingrediente
            // Dominio chiuso: un ingrediente appartiene a una sola categoria
            // Serve per raggruppamento e UI
            $table->enum('category', [
                'bread',
                'meat',
                'cheese',
                'vegetable',
                'sauce',
                'other'
            ]);

            // Stato di disponibilità
            // true  -> ingrediente presente e selezionabile
            // false -> ingrediente terminato
            // Non esiste uno stato intermedio
            $table->boolean('is_available')->default(true);

            // Timestamp automatici
            // created_at -> quando l'ingrediente è stato inserito
            // updated_at -> ultima modifica (es. cambio stato)
            $table->timestamps();
        });
    }

    /**
     * Annulla la migration.
     *
     * Permette il rollback sicuro della tabella.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
