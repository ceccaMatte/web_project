<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder per la creazione degli utenti del sistema.
 * 
 * UTENTI CREATI:
 * - 5 utenti normali (role="user") per simulare i clienti del paninaro
 * - 1 utente amministratore (role="admin") per la gestione del sistema
 * 
 * Password HASH: "password" (Hash::make)
 * Tutti abilitati: enabled=true
 */
class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        /**
         * Crea i 5 utenti normali.
         * Email: user{1-5}@test.it
         * Nickname: User {1-5}
         */
        for ($i = 1; $i <= 5; $i++) {
            User::create([
                'name' => "User $i",
                'nickname' => "User $i",
                'email' => "user{$i}@test.it",
                'password' => Hash::make('password'),
                'role' => 'user',
                'enabled' => true,
            ]);
        }

        /**
         * Crea l'utente amministratore.
         * Email: admin@test.it
         * Nickname: Admin
         * Role: admin (accesso alle funzioni di gestione)
         */
        User::create([
            'name' => 'Admin User',
            'nickname' => 'Admin',
            'email' => 'admin@test.it',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'enabled' => true,
        ]);
    }
}
