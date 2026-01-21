<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Test users
        User::create([
            'name' => 'Mario Rossi',
            'nickname' => 'Mario',
            'email' => 'mario@example.com',
            'password' => Hash::make('password'),
            'enabled' => true,
        ]);

        User::create([
            'name' => 'Giulia Bianchi',
            'nickname' => 'Giulia',
            'email' => 'giulia@example.com',
            'password' => Hash::make('password'),
            'enabled' => true,
        ]);

        User::create([
            'name' => 'Luca Verdi',
            'nickname' => 'Luca',
            'email' => 'luca@example.com',
            'password' => Hash::make('password'),
            'enabled' => false, // Utente disabilitato
        ]);

        // Admin
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