<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Aggiunge ingredient_configuration_id alla tabella favorite_sandwiches.
     * 
     * Questo campo contiene l'hash MD5 (16 caratteri) della combinazione
     * di ingredienti, permettendo lookup veloci per verificare se una
     * configurazione è già nei preferiti.
     */
    public function up(): void
    {
        Schema::table('favorite_sandwiches', function (Blueprint $table) {
            // Hash univoco della configurazione ingredienti
            // 16 caratteri hex, generato da MD5 degli IDs ingredienti ordinati
            $table->string('ingredient_configuration_id', 16)
                  ->after('user_id')
                  ->nullable();
            
            // Indice per lookup veloci per utente + configurazione
            $table->index(['user_id', 'ingredient_configuration_id'], 'favorite_user_config_idx');
        });
    }

    /**
     * Annulla la migration.
     */
    public function down(): void
    {
        Schema::table('favorite_sandwiches', function (Blueprint $table) {
            $table->dropIndex('favorite_user_config_idx');
            $table->dropColumn('ingredient_configuration_id');
        });
    }
};
