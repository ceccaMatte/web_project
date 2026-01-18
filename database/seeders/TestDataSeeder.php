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
 * - WorkingDay per oggi e ieri (con time slots)
 * - Ordini attivi per oggi (pending, confirmed, ready)
 * - Ordini storici per ieri (picked_up, rejected)
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
        // 3️⃣  CREA WORKING DAY IERI (per ordini storici)
        // ============================================
        
        $yesterday = now()->subDay()->toDateString();
        $yesterdayWorkingDay = WorkingDay::create([
            'day' => $yesterday,
            'location' => 'Piazza Centrale - Engineering Hub',
            'max_orders' => 20,
            'max_time' => 30,
            'start_time' => '11:00',
            'end_time' => '13:00',
            'is_active' => false, // ieri è passato
        ]);

        echo "✅ Creato WorkingDay per ieri: {$yesterday}\n";

        $yesterdaySlots = $this->createTimeSlots($yesterdayWorkingDay, '11:00', '12:30', 15);
        echo "✅ Creati " . count($yesterdaySlots) . " time slots per ieri\n";

        // ============================================
        // 4️⃣  CREA WORKING DAY OGGI (18/01/2026 con orari 14:00-18:00 per test)
        // ============================================
        
        $today = now()->toDateString();
        $todayWorkingDay = WorkingDay::create([
            'day' => $today,
            'location' => 'Piazza Centrale - Engineering Hub',
            'max_orders' => 20,
            'max_time' => 30,
            'start_time' => '14:00',
            'end_time' => '18:00',
            'is_active' => true,
        ]);

        echo "✅ Creato WorkingDay per oggi: {$today} (14:00-18:00 per test)\n";

        $todaySlots = $this->createTimeSlots($todayWorkingDay, '14:00', '17:45', 15);
        echo "✅ Creati " . count($todaySlots) . " time slots per oggi\n";

        // ============================================
        // 5️⃣  CREA WORKING DAY DOMANI
        // ============================================
        
        $tomorrow = now()->addDay()->toDateString();
        $tomorrowWorkingDay = WorkingDay::create([
            'day' => $tomorrow,
            'location' => 'Piazza Centrale - Engineering Hub',
            'max_orders' => 20,
            'max_time' => 30,
            'start_time' => '11:00',
            'end_time' => '13:00',
            'is_active' => true,
        ]);

        echo "✅ Creato WorkingDay per domani: {$tomorrow}\n";

        $tomorrowSlots = $this->createTimeSlots($tomorrowWorkingDay, '11:00', '12:30', 15);
        echo "✅ Creati " . count($tomorrowSlots) . " time slots per domani\n";

        // ============================================
        // 6️⃣  CREA ORDINI STORICI (ieri - picked_up)
        // ============================================
        
        // Ordine storico 1: Mario - Panino Classico (picked_up)
        $order1 = $this->createOrderWithIngredients(
            $userMario, 
            $yesterdaySlots[0], 
            $yesterdayWorkingDay, 
            'picked_up',
            ['Ciabatta', 'Prosciutto Cotto', 'Mozzarella', 'Lattuga', 'Maionese']
        );

        // Ordine storico 2: Mario - Panino Vegetariano (picked_up)
        $order2 = $this->createOrderWithIngredients(
            $userMario, 
            $yesterdaySlots[1], 
            $yesterdayWorkingDay, 
            'picked_up',
            ['Pane Integrale', 'Mozzarella', 'Pomodoro', 'Basilico', 'Olio EVO']
        );

        // Ordine storico 3: Mario - Panino rifiutato (rejected)
        $this->createOrderWithIngredients(
            $userMario, 
            $yesterdaySlots[2], 
            $yesterdayWorkingDay, 
            'rejected',
            ['Focaccia', 'Salame', 'Gorgonzola']
        );

        echo "✅ Creati 3 ordini storici per ieri\n";

        // ============================================
        // 7️⃣  CREA ORDINI ATTIVI (oggi)
        // ============================================
        
        // Ordine attivo 1: Mario - Pending (modificabile)
        $this->createOrderWithIngredients(
            $userMario, 
            $todaySlots[0], 
            $todayWorkingDay, 
            'pending',
            ['Ciabatta', 'Prosciutto Crudo', 'Burrata', 'Rucola']
        );

        // Ordine attivo 2: Mario - Confirmed (in preparazione)
        $this->createOrderWithIngredients(
            $userMario, 
            $todaySlots[1], 
            $todayWorkingDay, 
            'confirmed',
            ['Pane Toscano', 'Porchetta', 'Pecorino', 'Salsa Verde']
        );

        // Ordine attivo 3: Mario - Ready (pronto per ritiro)
        $this->createOrderWithIngredients(
            $userMario, 
            $todaySlots[2], 
            $todayWorkingDay, 
            'ready',
            ['Focaccia', 'Tonno', 'Pomodoro', 'Olive', 'Maionese']
        );

        // Ordine Luigi: Pending
        $this->createOrderWithIngredients(
            $userLuigi, 
            $todaySlots[3], 
            $todayWorkingDay, 
            'pending',
            ['Ciabatta', 'Bresaola', 'Grana', 'Rucola', 'Olio EVO']
        );

        echo "✅ Creati 4 ordini attivi per oggi\n";

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
        echo "║ 📅 Working Days: 3                         ║\n";
        echo "║    - Ieri: " . $yesterday . "                ║\n";
        echo "║    - Oggi: " . $today . "                   ║\n";
        echo "║    - Domani: " . $tomorrow . "               ║\n";
        echo "║                                            ║\n";
        echo "║ 🛒 Ordini: 7                              ║\n";
        echo "║    - Storici (ieri): 3                     ║\n";
        echo "║    - Attivi (oggi): 4                      ║\n";
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
}
