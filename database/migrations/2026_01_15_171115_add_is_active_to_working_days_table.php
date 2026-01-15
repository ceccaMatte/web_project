<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Aggiunge il campo is_active alla tabella working_days.
     * 
     * Questo campo indica se il giorno lavorativo è attivo o meno.
     * I giorni non attivi non vengono mostrati nella UI.
     */
    public function up(): void
    {
        Schema::table('working_days', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('max_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('working_days', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
