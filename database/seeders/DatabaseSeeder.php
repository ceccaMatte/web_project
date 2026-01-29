<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Seeder principale per il database del progetto "Campus Truck / Paninaro".
 * 
 * Orchestreazza l'esecuzione di tutti i seeders in ordine logico:
 * 1. UserSeeder: crea 5 utenti normali + 1 admin
 * 2. IngredientsSeeder: popola il catalogo ingredienti
 * 3. WorkingDaySeeder: crea i giorni lavorativi per gennaio 2026
 * 4. TimeSlotSeeder: genera i time slot da 15 minuti per i working_days attivi
 * 5. OrdersSeeder: crea gli ordini con snapshot ingredienti
 * 6. FavoriteSandwichesSeeder: crea i panini preferiti per utente
 * 
 * DIPENDENZE:
 * - OrdersSeeder dipende da: Users, Ingredients, WorkingDays, TimeSlots
 * - FavoriteSandwichesSeeder dipende da: Users, Ingredients
 * 
 * Non usare transazioni per evitare rollback di dati già creati se uno seeder fallisce.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Esecuzione in sequenza
        $this->call([
            UserSeeder::class,
            IngredientsSeeder::class,
            WorkingDaySeeder::class,
            TimeSlotSeeder::class,
            OrderSeeder::class,
            FavoriteSandwichesSeeder::class,
        ]);
    }
}

