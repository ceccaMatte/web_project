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
 * - Giorni lavorativi: lunedì 19/01/2026 (11:00-15:00, Uni stazione), mercoledì 21/01/2026 (8:00-19:00, Uni Biblio), venerdì 23/01/2026 (11:00-16:00, Uni Biblio)
 * - 50 ordini per giorno distribuiti tra ready, confirmed, pending
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
        // 3️⃣  CREA WORKING DAYS
        // ============================================

        $workingDays = [
            [
                'day' => '2026-01-19', // Lunedì
                'location' => 'Uni stazione',
                'start_time' => '11:00',
                'end_time' => '15:00',
            ],
            [
                'day' => '2026-01-21', // Mercoledì
                'location' => 'Uni Biblio',
                'start_time' => '08:00',
                'end_time' => '19:00',
            ],
            [
                'day' => '2026-01-23', // Venerdì
                'location' => 'Uni Biblio',
                'start_time' => '11:00',
                'end_time' => '16:00',
            ],
        ];

        $createdWorkingDays = [];
        $timeSlotGenerator = new TimeSlotGeneratorService();

        foreach ($workingDays as $wdData) {
            $workingDay = WorkingDay::create([
                'day' => $wdData['day'],
                'location' => $wdData['location'],
                'max_orders' => 100,
                'max_time' => 30,
                'start_time' => $wdData['start_time'],
                'end_time' => $wdData['end_time'],
                'is_active' => true,
            ]);

            $slotsCreated = $timeSlotGenerator->generate($workingDay);
            $createdWorkingDays[] = $workingDay;
            echo "✅ Creato WorkingDay {$workingDay->day}: {$wdData['start_time']}-{$wdData['end_time']} ({$slotsCreated} slots)\n";
        }

        // ============================================
        // 4️⃣  CREA ORDINI (50 per giorno distribuiti)
        // ============================================

        $totalOrders = 0;
        $statuses = ['pending', 'confirmed', 'ready'];

        foreach ($createdWorkingDays as $workingDay) {
            $daySlots = $workingDay->timeSlots;
            $ordersPerSlot = 50 / count($daySlots); // Distribuzione uniforme
            $slotIndex = 0;
            $dayOrders = 0;

            foreach ($daySlots as $timeSlot) {
                $slotOrders = floor($ordersPerSlot);
                if ($dayOrders + $slotOrders < 50 && $slotIndex < (50 % count($daySlots))) {
                    $slotOrders++;
                }

                for ($i = 0; $i < $slotOrders; $i++) {
                    $status = $statuses[$dayOrders % count($statuses)];
                    $user = $normalUsers[$dayOrders % count($normalUsers)];
                    $orderIngredients = $this->getRandomIngredients();

                    $this->createOrderWithIngredients(
                        $user,
                        $timeSlot,
                        $workingDay,
                        $status,
                        $orderIngredients
                    );

                    $dayOrders++;
                    $totalOrders++;
                    if ($dayOrders >= 50) break;
                }

                if ($dayOrders >= 50) break;
                $slotIndex++;
            }

            echo "✅ Creati {$dayOrders} ordini per il giorno {$workingDay->day}\n";
        }

        echo "✅ Creati {$totalOrders} ordini totali distribuiti sui 3 utenti normali\n";

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
        echo "║ 📅 Working Days: 3                         ║\n";
        echo "║    - Lun 19/01/2026: 11:00-15:00 (Uni stazione) ║\n";
        echo "║    - Mer 21/01/2026: 08:00-19:00 (Uni Biblio) ║\n";
        echo "║    - Ven 23/01/2026: 11:00-16:00 (Uni Biblio) ║\n";
        echo "║                                            ║\n";
        echo "║ 🛒 Ordini: {$totalOrders} (50 per giorno, ready/confirmed/pending) ║\n";
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