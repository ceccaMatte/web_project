<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Esegue la migration.
     *
     * Questa tabella rappresenta tutti gli utenti autenticabili del sistema.
     * Sia utenti normali che admin sono modellati qui e differenziati
     * tramite il campo "role".
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {

            // Chiave primaria
            // BIGINT auto-increment, standard Laravel.
            $table->id();

            // Nome visuale generico (Laravel default)
            // Può essere usato come fallback o nome completo.
            $table->string('name');

            // Nickname visualizzato nell'interfaccia
            // Non è usato per il login e può essere duplicato.
            $table->string('nickname');

            // Email usata per il login
            // Deve essere unica per garantire autenticazione corretta.
            $table->string('email')->unique();

            // Timestamp di verifica email
            // Utile se in futuro abiliti la verifica email.
            $table->timestamp('email_verified_at')->nullable();

            // Password hashata
            // Laravel gestisce hashing e verifica in modo sicuro.
            $table->string('password');

            // Ruolo applicativo
            // Serve per distinguere user / admin.
            $table->enum('role', ['user', 'admin'])->default('user');

            // Token per "ricordami"
            // Gestito automaticamente da Laravel.
            $table->rememberToken();

            // Timestamp standard
            // created_at / updated_at
            $table->timestamps();
        });

        /**
         * Tabella per il reset password.
         * Laravel la usa automaticamente se abiliti il recupero password.
         */
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        /**
         * Tabella delle sessioni.
         * Permette di salvare le sessioni nel database
         * invece che su file (più sicuro e scalabile).
         */
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Rollback della migration.
     *
     * Elimina tutte le tabelle create da questa migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
