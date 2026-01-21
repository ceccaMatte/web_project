<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WorkingDay;
use App\Models\TimeSlot;
use App\Models\Order;
use App\Models\Ingredient;
use App\Models\OrderIngredient;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Services\TimeSlotGeneratorService;
use Carbon\Carbon;

/**
 * SEEDER PER I REQUISITI SPECIFICI DELL'UTENTE
 *
 * ✅ Crea:
 * - 1 utente admin: admin@test.it (password)
 * - 3 utenti normali: user1@test.it, user2@test.it, user3@test.it (password)
 * - Ingredienti per ogni categoria (almeno 4-6 per categoria)
 * - Solo oggi (20 gennaio 2026) con orari 11:00-15:00
 * - 30 ordini distribuiti tra confirmed, ready, pending
 * - Ordini assegnati ai 3 utenti normali
 *
 * 🔐 CREDENZIALI:
 * - Admin: admin@test.it / password
 * - User1: user1@test.it / password
 * - User2: user2@test.it / password
 * - User3: user3@test.it / password
 */
class UserRequirementsSeeder extends Seeder
{
    public function run(): void
    {
        // Disabilita foreign key constraints per truncate
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Svuota le tabelle (ordine inverso delle dipendenze)
        DB::table('favorite_sandwich_ingredients')->truncate();
        DB::table('favorite_sandwiches')->truncate();
        OrderIngredient::truncate();
        Order::truncate();
        TimeSlot::truncate();
        WorkingDay::truncate();
        Ingredient::truncate();
        User::truncate();

        // Riabilita foreign key constraints
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        echo "🧹 Database pulito completamente\n";

        // ============================================
        // 1️⃣  CREA UTENTI
        // ============================================

        $adminUser = User::create([
            'name' => 'Admin User',
            'nickname' => 'Admin',
            'email' => 'admin@test.it',
            'password' => 'password',
            'role' => 'admin',
            'enabled' => true,
        ]);

        $user1 = User::create([
            'name' => 'User One',
            'nickname' => 'User1',
            'email' => 'user1@test.it',
            'password' => 'password',
            'role' => 'user',
            'enabled' => true,
        ]);

        $user2 = User::create([
            'name' => 'User Two',
            'nickname' => 'User2',
            'email' => 'user2@test.it',
            'password' => 'password',
            'role' => 'user',
            'enabled' => true,
        ]);

        $user3 = User::create([
            'name' => 'User Three',
            'nickname' => 'User3',
            'email' => 'user3@test.it',
            'password' => 'password',
            'role' => 'user',
            'enabled' => true,
        ]);

        $normalUsers = [$user1, $user2, $user3];

        echo "✅ Creati 4 utenti (1 admin + 3 normali)\n";

        // ============================================
        // 2️⃣  CREA INGREDIENTI (almeno 4-6 per categoria)
        // ============================================

        $ingredients = $this->createIngredients();
        echo "✅ Creati " . count($ingredients) . " ingredienti\n";

        // ============================================
        // 3️⃣  CREA WORKING DAY (solo oggi 20 gennaio 2026, 11:00-15:00)
        // ============================================

        $today = Carbon::createFromFormat('Y-m-d', '2026-01-20'); // Oggi è 20 gennaio 2026

        $workingDay = WorkingDay::create([
            'day' => $today->toDateString(),
            'location' => 'Engineering Hub',
            'max_orders' => 100,
            'max_time' => 30,
            'start_time' => '11:00',
            'end_time' => '15:00',
            'is_active' => true,
        ]);

        // Genera time slots usando il service dedicato
        $timeSlotGenerator = new TimeSlotGeneratorService();
        $slotsCreated = $timeSlotGenerator->generate($workingDay);
        echo "✅ Creato WorkingDay {$today->format('d/m/Y')}: 11:00-15:00 ({$slotsCreated} slots)\n";

        // ============================================
        // 4️⃣  CREA 30 ORDINI DISTRIBUITI
        // ============================================

        $daySlots = $workingDay->timeSlots;
        $totalOrders = 0;
        $statuses = ['pending', 'confirmed', 'ready'];

        // Distribuisci 30 ordini sui time slots
        $ordersPerSlot = 30 / count($daySlots); // ~1.875 ordini per slot
        $slotIndex = 0;

        foreach ($daySlots as $timeSlot) {
            // Calcola quanti ordini per questo slot (distribuzione uniforme)
            $slotOrders = floor($ordersPerSlot);
            if ($totalOrders + $slotOrders < 30 && $slotIndex < (30 % count($daySlots))) {
                $slotOrders++;
            }

            // Crea ordini per questo slot
            for ($i = 0; $i < $slotOrders; $i++) {
                // Stato ordine distribuito
                $status = $statuses[$totalOrders % count($statuses)];

                // Utente normale (ciclico)
                $user = $normalUsers[$totalOrders % count($normalUsers)];

                // Ingredienti casuali
                $orderIngredients = $this->getRandomIngredients();

                $this->createOrderWithIngredients(
                    $user,
                    $timeSlot,
                    $workingDay,
                    $status,
                    $orderIngredients
                );

                $totalOrders++;
                if ($totalOrders >= 30) break;
            }

            if ($totalOrders >= 30) break;
            $slotIndex++;
        }

        echo "✅ Creati {$totalOrders} ordini distribuiti sui 3 utenti normali\n";

        // ============================================
        // RIEPILOGO
        // ============================================

        echo "\n";
        echo "╔════════════════════════════════════════════╗\n";
        echo "║   📊 SEED COMPLETATO (REQUISITI UTENTE)   ║\n";
        echo "╠════════════════════════════════════════════╣\n";
        echo "║ 👤 Utenti:                                ║\n";
        echo "║    - admin@test.it (password, admin)      ║\n";
        echo "║    - user1@test.it (password)             ║\n";
        echo "║    - user2@test.it (password)             ║\n";
        echo "║    - user3@test.it (password)             ║\n";
        echo "║                                            ║\n";
        echo "║ 🥪 Ingredienti: " . count($ingredients) . " per categoria       ║\n";
        echo "║                                            ║\n";
        echo "║ 📅 Working Day: 1 (oggi 20/01/2026)       ║\n";
        echo "║    - Orari: 11:00-15:00 (16 slots)        ║\n";
        echo "║                                            ║\n";
        echo "║ 🛒 Ordini: {$totalOrders} (confirmed/ready/pending) ║\n";
        echo "║    - Distribuiti sui 3 utenti normali     ║\n";
        echo "╚════════════════════════════════════════════╝\n";
    }

    /**
     * Crea ingredienti per ogni categoria (almeno 4-6 per categoria)
     */
    private function createIngredients(): array
    {
        $ingredientsData = [
            // Bread (5 ingredienti)
            ['name' => 'Ciabatta', 'code' => 'CIAB', 'category' => 'bread'],
            ['name' => 'Focaccia', 'code' => 'FOC', 'category' => 'bread'],
            ['name' => 'Pane Integrale', 'code' => 'PINT', 'category' => 'bread'],
            ['name' => 'Pane Toscano', 'code' => 'PTOS', 'category' => 'bread'],
            ['name' => 'Baguette', 'code' => 'BAG', 'category' => 'bread'],

            // Meat (6 ingredienti)
            ['name' => 'Prosciutto Cotto', 'code' => 'PCOT', 'category' => 'meat'],
            ['name' => 'Prosciutto Crudo', 'code' => 'PCRU', 'category' => 'meat'],
            ['name' => 'Salame', 'code' => 'SAL', 'category' => 'meat'],
            ['name' => 'Bresaola', 'code' => 'BRES', 'category' => 'meat'],
            ['name' => 'Porchetta', 'code' => 'PORC', 'category' => 'meat'],
            ['name' => 'Tonno', 'code' => 'TON', 'category' => 'meat'],

            // Cheese (5 ingredienti)
            ['name' => 'Mozzarella', 'code' => 'MOZ', 'category' => 'cheese'],
            ['name' => 'Burrata', 'code' => 'BUR', 'category' => 'cheese'],
            ['name' => 'Gorgonzola', 'code' => 'GORG', 'category' => 'cheese'],
            ['name' => 'Pecorino', 'code' => 'PEC', 'category' => 'cheese'],
            ['name' => 'Grana', 'code' => 'GRA', 'category' => 'cheese'],

            // Vegetable (6 ingredienti)
            ['name' => 'Lattuga', 'code' => 'LAT', 'category' => 'vegetable'],
            ['name' => 'Pomodoro', 'code' => 'POM', 'category' => 'vegetable'],
            ['name' => 'Rucola', 'code' => 'RUC', 'category' => 'vegetable'],
            ['name' => 'Olive', 'code' => 'OLI', 'category' => 'vegetable'],
            ['name' => 'Basilico', 'code' => 'BAS', 'category' => 'vegetable'],
            ['name' => 'Cipolla', 'code' => 'CIP', 'category' => 'vegetable'],

            // Sauce (5 ingredienti)
            ['name' => 'Maionese', 'code' => 'MAY', 'category' => 'sauce'],
            ['name' => 'Olio EVO', 'code' => 'OEVO', 'category' => 'sauce'],
            ['name' => 'Salsa Verde', 'code' => 'SVER', 'category' => 'sauce'],
            ['name' => 'Ketchup', 'code' => 'KET', 'category' => 'sauce'],
            ['name' => 'Senape', 'code' => 'SEN', 'category' => 'sauce'],

            // Other (4 ingredienti)
            ['name' => 'Uovo', 'code' => 'UOV', 'category' => 'other'],
            ['name' => 'Bacon', 'code' => 'BAC', 'category' => 'other'],
            ['name' => 'Patatine', 'code' => 'PAT', 'category' => 'other'],
            ['name' => 'Carciofi', 'code' => 'CAR', 'category' => 'other'],
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

        // Associa ingredienti all'ordine (tramite tabella pivot order_ingredients come snapshot)
        foreach ($ingredientNames as $ingredientName) {
            $ingredient = Ingredient::where('name', $ingredientName)->first();
            if ($ingredient) {
                OrderIngredient::create([
                    'order_id' => $order->id,
                    'name' => $ingredient->name, // snapshot del nome
                    'category' => $ingredient->category, // snapshot della categoria
                ]);
            }
        }

        return $order;
    }

    /**
     * Restituisce ingredienti casuali per un ordine
     */
    private function getRandomIngredients(): array
    {
        $ingredients = [
            // Pane (sempre presente)
            'Ciabatta',

            // Proteina (1-2)
            ['Prosciutto Cotto', 'Salame', 'Tonno'][array_rand(['Prosciutto Cotto', 'Salame', 'Tonno'])],

            // Formaggio (1)
            ['Mozzarella', 'Gorgonzola'][array_rand(['Mozzarella', 'Gorgonzola'])],

            // Verdure (1-2)
            ['Lattuga', 'Pomodoro'][array_rand(['Lattuga', 'Pomodoro'])],

            // Salse (1)
            ['Maionese', 'Olio EVO'][array_rand(['Maionese', 'Olio EVO'])],
        ];

        return $ingredients;
    }
}