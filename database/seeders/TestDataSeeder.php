<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WorkingDay;
use App\Models\TimeSlot;
use App\Models\Order;
use App\Models\Ingredient;
use App\Models\OrderIngredient;
use App\Models\FavoriteSandwich;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * SEEDER PER DATI DI TEST
 *
 * Popola il database con dati realistici per sviluppo locale.
 *
 * ✅ Crea:
 * - 3 utenti (1 loggabile principale, 2 aggiuntivi)
 * - Ingredienti per categoria (bread, meat, cheese, vegetable, sauce)
 * - 7 WorkingDay (3 giorni passati + 4 giorni attivi) con orari 08:00-20:00
 * - Time slots: 48 slot/giorno (15 minuti ciascuno)
 * - Ordini distribuiti: ~350+ ordini totali (~50+ per giorno)
 * - Stati ordini realistici (pending, confirmed, ready, picked_up, rejected)
 * - Preferiti per testare il toggle
 *
 * 🔐 CREDENZIALI DI TEST:
 * - Email: mario@test.it
 * - Password: password
 * 
 * 📝 ESECUZIONE:
 * php artisan db:seed --class=TestDataSeeder
 */
class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Disabilita foreign key constraints per truncate
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Svuota le tabelle (ordine inverso delle dipendenze)
        DB::table('favorite_sandwich_ingredients')->truncate();
        FavoriteSandwich::truncate();
        OrderIngredient::truncate();
        Order::truncate();
        TimeSlot::truncate();
        WorkingDay::truncate();
        Ingredient::truncate();
        User::truncate();

        // Riabilita foreign key constraints
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // ============================================
        // 1️⃣  CREA UTENTI
        // ============================================
        
        $userMario = User::create([
            'name' => 'Mario Rossi',
            'nickname' => 'Mario',
            'email' => 'mario@test.it',
            'password' => 'password', // Hash automatico tramite cast 'hashed'
            'role' => 'user',
            'enabled' => true,
        ]);

        $userLuigi = User::create([
            'name' => 'Luigi Bianchi',
            'nickname' => 'Luigi',
            'email' => 'luigi@test.it',
            'password' => 'password',
            'role' => 'user',
            'enabled' => true,
        ]);

        $userAdmin = User::create([
            'name' => 'Admin User',
            'nickname' => 'Admin',
            'email' => 'admin@test.it',
            'password' => 'password',
            'role' => 'admin',
            'enabled' => true,
        ]);

        echo "✅ Creati 3 utenti\n";

        // ============================================
        // 2️⃣  CREA INGREDIENTI
        // ============================================
        
        $ingredients = $this->createIngredients();
        echo "✅ Creati " . count($ingredients) . " ingredienti\n";

        // ============================================
        // 3️⃣  CREA WORKING DAYS (7 giorni con orari 8:00-20:00)
        // ============================================

        $workingDays = [];
        $users = [$userMario, $userLuigi, $userAdmin];

        // Crea 7 giorni lavorativi (da 3 giorni fa a 3 giorni avanti)
        for ($i = -3; $i <= 3; $i++) {
            $date = now()->addDays($i)->toDateString();
            $isActive = $i >= 0; // Giorni passati non attivi

            $workingDay = WorkingDay::create([
                'day' => $date,
                'location' => 'Piazza Centrale - Engineering Hub',
                'max_orders' => 100, // Aumentato per supportare più ordini
                'max_time' => 30,
                'start_time' => '08:00',
                'end_time' => '20:00',
                'is_active' => $isActive,
            ]);

            $workingDays[] = $workingDay;

            // Genera time slots per ogni giorno (8:00-20:00 = 48 slots)
            $slots = $this->createTimeSlots($workingDay, '08:00', '19:45', 15);
            echo "✅ Creato WorkingDay {$date}: 08:00-20:00 ({$workingDay->timeSlots()->count()} slots)\n";
        }

        echo "✅ Creati 7 giorni lavorativi con orari 08:00-20:00\n";

        // ============================================
        // 6️⃣  CREA ORDINI DISTRIBUITI (almeno 50 per giorno)
        // ============================================

        $totalOrders = 0;

        // Per ogni giorno lavorativo
        foreach ($workingDays as $index => $workingDay) {
            $daySlots = $workingDay->timeSlots;
            $isPast = $index < 3; // Primi 3 giorni sono passati

            // Target: almeno 50 ordini per giorno
            $targetOrders = 50;
            $ordersCreated = 0;

            // Distribuisci ordini sui time slots
            foreach ($daySlots as $slotIndex => $timeSlot) {
                // Calcola quanti ordini per questo slot (distribuzione non uniforme)
                $slotOrders = $this->calculateOrdersForSlot($slotIndex, count($daySlots), $targetOrders);
                $ordersCreated += $slotOrders;

                // Crea ordini per questo slot
                for ($i = 0; $i < $slotOrders; $i++) {
                    // Stato ordine basato sul giorno e posizione
                    $status = $this->getOrderStatusForSlot($isPast, $slotIndex, $i);

                    // Utente casuale
                    $user = $users[array_rand($users)];

                    // Ingredienti casuali
                    $orderIngredients = $this->getRandomIngredients();

                    $this->createOrderWithIngredients(
                        $user,
                        $timeSlot,
                        $workingDay,
                        $status,
                        $orderIngredients
                    );
                }
            }

            $totalOrders += $ordersCreated;
            echo "✅ Creati {$ordersCreated} ordini per {$workingDay->day->format('d/m/Y')}\n";
        }

        echo "✅ Creati {$totalOrders} ordini totali distribuiti sui 7 giorni\n";

        // ============================================
        // 8️⃣  CREA PREFERITI
        // ============================================
        
        // Mario ha salvato il "Panino Classico" come preferito
        $classicConfig = FavoriteSandwich::generateConfigurationId(
            ['Ciabatta', 'Prosciutto Cotto', 'Mozzarella', 'Lattuga', 'Maionese']
        );
        
        $favorite = FavoriteSandwich::create([
            'user_id' => $userMario->id,
            'ingredient_configuration_id' => $classicConfig,
        ]);

        // Associa ingredienti al preferito
        $favoriteIngredientIds = Ingredient::whereIn('name', [
            'Ciabatta', 'Prosciutto Cotto', 'Mozzarella', 'Lattuga', 'Maionese'
        ])->pluck('id')->toArray();
        $favorite->ingredients()->attach($favoriteIngredientIds);

        echo "✅ Creato 1 preferito per Mario\n";

        // ============================================
        // RIEPILOGO
        // ============================================
        
        echo "\n";
        echo "╔════════════════════════════════════════════╗\n";
        echo "║   📊 SEED COMPLETATO                       ║\n";
        echo "╠════════════════════════════════════════════╣\n";
        echo "║ 👤 Utenti: 3                              ║\n";
        echo "║    - mario@test.it (password)             ║\n";
        echo "║    - luigi@test.it (password)             ║\n";
        echo "║    - admin@test.it (password, admin)      ║\n";
        echo "║                                            ║\n";
        echo "║ 🥪 Ingredienti: " . count($ingredients) . "                        ║\n";
        echo "║                                            ║\n";
        echo "║ 📅 Working Days: 7                         ║\n";
        echo "║    - Orari: 08:00-20:00 (48 slots/giorno) ║\n";
        echo "║                                            ║\n";
        echo "║ 🛒 Ordini: {$totalOrders}                              ║\n";
        echo "║    - Distribuiti su 7 giorni               ║\n";
        echo "║    - ~50+ ordini per giorno               ║\n";
        echo "║                                            ║\n";
        echo "║ ⭐ Preferiti: 1                            ║\n";
        echo "╚════════════════════════════════════════════╝\n";
    }

    /**
     * Crea ingredienti per categoria
     */
    private function createIngredients(): array
    {
        $ingredientsData = [
            // Pane
            ['name' => 'Ciabatta', 'code' => 'CIAB', 'category' => 'bread'],
            ['name' => 'Focaccia', 'code' => 'FOC', 'category' => 'bread'],
            ['name' => 'Pane Integrale', 'code' => 'PINT', 'category' => 'bread'],
            ['name' => 'Pane Toscano', 'code' => 'PTOS', 'category' => 'bread'],
            
            // Carne
            ['name' => 'Prosciutto Cotto', 'code' => 'PCOT', 'category' => 'meat'],
            ['name' => 'Prosciutto Crudo', 'code' => 'PCRU', 'category' => 'meat'],
            ['name' => 'Salame', 'code' => 'SAL', 'category' => 'meat'],
            ['name' => 'Bresaola', 'code' => 'BRES', 'category' => 'meat'],
            ['name' => 'Porchetta', 'code' => 'PORC', 'category' => 'meat'],
            ['name' => 'Tonno', 'code' => 'TON', 'category' => 'meat'],
            
            // Formaggi
            ['name' => 'Mozzarella', 'code' => 'MOZ', 'category' => 'cheese'],
            ['name' => 'Burrata', 'code' => 'BUR', 'category' => 'cheese'],
            ['name' => 'Gorgonzola', 'code' => 'GORG', 'category' => 'cheese'],
            ['name' => 'Pecorino', 'code' => 'PEC', 'category' => 'cheese'],
            ['name' => 'Grana', 'code' => 'GRA', 'category' => 'cheese'],
            
            // Verdure
            ['name' => 'Lattuga', 'code' => 'LAT', 'category' => 'vegetable'],
            ['name' => 'Pomodoro', 'code' => 'POM', 'category' => 'vegetable'],
            ['name' => 'Rucola', 'code' => 'RUC', 'category' => 'vegetable'],
            ['name' => 'Olive', 'code' => 'OLI', 'category' => 'vegetable'],
            ['name' => 'Basilico', 'code' => 'BAS', 'category' => 'vegetable'],
            
            // Salse
            ['name' => 'Maionese', 'code' => 'MAY', 'category' => 'sauce'],
            ['name' => 'Olio EVO', 'code' => 'OEVO', 'category' => 'sauce'],
            ['name' => 'Salsa Verde', 'code' => 'SVER', 'category' => 'sauce'],
        ];

        $ingredients = [];
        foreach ($ingredientsData as $data) {
            $ingredients[] = Ingredient::create([
                'name' => $data['name'],
                'code' => $data['code'],
                'category' => $data['category'],
                'is_available' => true,
            ]);
        }

        return $ingredients;
    }

    /**
     * Crea un ordine con ingredienti snapshot
     */
    private function createOrderWithIngredients(
        User $user, 
        TimeSlot $slot, 
        WorkingDay $workingDay, 
        string $status,
        array $ingredientNames
    ): Order {
        static $dailyNumber = 0;
        $dailyNumber++;

        $order = new Order([
            'user_id' => $user->id,
            'time_slot_id' => $slot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => $dailyNumber,
        ]);
        $order->status = $status;
        $order->save();

        // Crea snapshot ingredienti
        foreach ($ingredientNames as $name) {
            $ingredient = Ingredient::where('name', $name)->first();
            $category = $ingredient ? $ingredient->category : 'other';

            OrderIngredient::create([
                'order_id' => $order->id,
                'name' => $name,
                'category' => $category,
            ]);
        }

        return $order;
    }

    /**
     * Helper: crea time slots per un working day
     */
    private function createTimeSlots(WorkingDay $workingDay, string $startTime, string $endTime, int $intervalMinutes): array
    {
        $slots = [];
        
        $start = Carbon::createFromFormat('H:i', $startTime);
        $end = Carbon::createFromFormat('H:i', $endTime);

        while ($start < $end) {
            $slotEnd = $start->clone()->addMinutes($intervalMinutes);

            $slot = TimeSlot::create([
                'working_day_id' => $workingDay->id,
                'start_time' => $start->format('H:i:s'),
                'end_time' => $slotEnd->format('H:i:s'),
            ]);

            $slots[] = $slot;
            $start = $slotEnd;
        }

        return $slots;
    }

    /**
     * Calcola quanti ordini creare per un determinato slot
     * Distribuzione non uniforme: più ordini negli orari di punta
     */
    private function calculateOrdersForSlot(int $slotIndex, int $totalSlots, int $targetOrders): int
    {
        // Distribuzione basata sull'ora del giorno (più ordini negli orari di punta)
        $hour = 8 + floor($slotIndex / 4); // Ogni 4 slot = 1 ora

        // Orari di punta: pranzo (12-14) e aperitivo (18-20)
        if ($hour >= 12 && $hour <= 14) {
            $weight = 1.5; // 50% più ordini
        } elseif ($hour >= 18 && $hour <= 20) {
            $weight = 1.3; // 30% più ordini
        } else {
            $weight = 0.8; // Meno ordini negli altri orari
        }

        // Calcola ordini base per slot
        $baseOrders = ceil($targetOrders / $totalSlots * $weight);

        // Aggiungi variazione casuale (±30%)
        $variation = rand(-30, 30) / 100;
        $finalOrders = max(0, round($baseOrders * (1 + $variation)));

        return (int) $finalOrders;
    }

    /**
     * Determina lo stato dell'ordine basato sul giorno e posizione
     */
    private function getOrderStatusForSlot(bool $isPast, int $slotIndex, int $orderIndex): string
    {
        if ($isPast) {
            // Giorni passati: ordini completati
            $statuses = ['picked_up', 'picked_up', 'picked_up', 'rejected'];
            return $statuses[array_rand($statuses)];
        } else {
            // Giorni attivi: distribuzione realistica
            $hour = 8 + floor($slotIndex / 4);

            if ($hour < 12) {
                // Mattina: principalmente pending
                $statuses = ['pending', 'pending', 'confirmed'];
            } elseif ($hour < 16) {
                // Pomeriggio: mix di stati
                $statuses = ['confirmed', 'confirmed', 'ready', 'pending'];
            } else {
                // Sera: più ready e picked_up
                $statuses = ['ready', 'ready', 'picked_up', 'confirmed'];
            }

            return $statuses[array_rand($statuses)];
        }
    }

    /**
     * Restituisce ingredienti casuali per un ordine
     */
    private function getRandomIngredients(): array
    {
        $ingredients = Ingredient::all();

        // Ingredienti per categoria
        $breads = $ingredients->where('category', 'bread')->pluck('name')->toArray();
        $meats = $ingredients->where('category', 'meat')->pluck('name')->toArray();
        $cheeses = $ingredients->where('category', 'cheese')->pluck('name')->toArray();
        $vegetables = $ingredients->where('category', 'vegetable')->pluck('name')->toArray();
        $sauces = $ingredients->where('category', 'sauce')->pluck('name')->toArray();

        $orderIngredients = [];

        // Sempre 1 pane
        $orderIngredients[] = $breads[array_rand($breads)];

        // 0-1 carne
        if (rand(0, 1)) {
            $orderIngredients[] = $meats[array_rand($meats)];
        }

        // 0-1 formaggio
        if (rand(0, 1)) {
            $orderIngredients[] = $cheeses[array_rand($cheeses)];
        }

        // 1-3 verdure
        $vegCount = rand(1, 3);
        shuffle($vegetables);
        for ($i = 0; $i < $vegCount; $i++) {
            $orderIngredients[] = $vegetables[$i];
        }

        // 0-1 salsa
        if (rand(0, 1)) {
            $orderIngredients[] = $sauces[array_rand($sauces)];
        }

        return array_unique($orderIngredients);
    }
}
