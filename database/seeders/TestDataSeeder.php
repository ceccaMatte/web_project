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

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Disabilita FK per truncate
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Truncate tabelle
        DB::table('favorite_sandwich_ingredients')->truncate();
        FavoriteSandwich::truncate();
        OrderIngredient::truncate();
        Order::truncate();
        TimeSlot::truncate();
        WorkingDay::truncate();
        Ingredient::truncate();
        User::truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // Seed utenti
        $userMario = User::create([
            'name' => 'Mario Rossi',
            'nickname' => 'Mario',
            'email' => 'mario@test.it',
            'password' => 'password', // Password hashed via model cast
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

        $ingredients = $this->createIngredients();
        $workingDays = [];
        $users = [$userMario, $userLuigi, $userAdmin];

        // Crea giorni lavorativi da oggi (19 gennaio 2026) a domenica (25 gennaio 2026)
        $today = Carbon::createFromFormat('Y-m-d', '2026-01-19'); // Oggi è 19 gennaio 2026
        
        for ($i = 0; $i < 7; $i++) {
            $date = $today->clone()->addDays($i);
            $isActive = true; // Tutti i giorni attivi

            $workingDay = WorkingDay::create([
                'day' => $date->toDateString(),
                'location' => 'Piazza Centrale - Engineering Hub',
                'max_orders' => 100,
                'max_time' => 30,
                'start_time' => '12:00',
                'end_time' => '20:00',
                'is_active' => $isActive,
            ]);

            $workingDays[] = $workingDay;

            $this->createTimeSlots($workingDay, '12:00', '19:45', 15);
        }

        // Created working days and slots
        $totalOrders = 0;

        // Per ogni giorno lavorativo
        foreach ($workingDays as $index => $workingDay) {
            $daySlots = $workingDay->timeSlots;
            $isToday = $index === 0; // Primo giorno è oggi

            // Target: 50 ordini per oggi, 20 per gli altri giorni
            $targetOrders = $isToday ? 50 : 20;
            $ordersCreated = 0;

            // Distribuisci ordini sui time slots
            foreach ($daySlots as $slotIndex => $timeSlot) {
                // Calcola quanti ordini per questo slot (distribuzione non uniforme)
                $slotOrders = $this->calculateOrdersForSlot($slotIndex, count($daySlots), $targetOrders);
                $ordersCreated += $slotOrders;

                // Crea ordini per questo slot
                for ($i = 0; $i < $slotOrders; $i++) {
                    // Stato ordine basato sul giorno e posizione
                    $status = $this->getOrderStatusForSlot($isToday, $slotIndex, $i);

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
        }

        // Create favorites
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

        // end run
    }

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

        // Snapshot ingredienti
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

    // Distribuzione non uniforme: peso per orari di punta
    private function calculateOrdersForSlot(int $slotIndex, int $totalSlots, int $targetOrders): int
    {
        // Distribuzione basata sull'ora del giorno (più ordini negli orari di punta)
        $hour = 12 + floor($slotIndex / 4); // Ogni 4 slot = 1 ora, partendo dalle 12:00

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

    private function getOrderStatusForSlot(bool $isToday, int $slotIndex, int $orderIndex): string
    {
        $hour = 12 + floor($slotIndex / 4);

        if ($isToday) {
            // Per oggi: stati realistici basati sull'ora corrente (assumiamo sia mattina)
            if ($hour < 14) {
                // Orari passati: principalmente completati
                $statuses = ['picked_up', 'picked_up', 'ready', 'confirmed'];
            } elseif ($hour < 16) {
                // Pomeriggio attuale: mix di stati
                $statuses = ['confirmed', 'confirmed', 'ready', 'pending'];
            } else {
                // Sera futura: principalmente pending
                $statuses = ['pending', 'pending', 'confirmed'];
            }
        } else {
            // Giorni futuri: principalmente pending con qualche confermato
            $statuses = ['pending', 'pending', 'pending', 'confirmed'];
        }

        return $statuses[array_rand($statuses)];
    }

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
