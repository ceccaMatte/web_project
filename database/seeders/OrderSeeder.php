<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderIngredient;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\Ingredient;
use App\Models\WorkingDay;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

/**
 * Seeder per gli ordini (Orders).
 * 
 * LOGICA GENERALE:
 * 1. Per ogni utente (5 users + 1 admin, ma solo gli utenti normali fanno ordini):
 *    - Distribuisce 8-12 ordini nel mese (gen 1-30, 2026)
 *    - Gli ordini sono sparsi realisticamente (non tutti lo stesso giorno)
 * 
 * 2. STATI ORDINI PER DATA:
 *    - Giorni passati (< 29/01): 'ready' oppure 'picked_up' (MAI 'pending' o 'confirmed')
 *    - Giorno corrente (29/01): mix di 'pending', 'confirmed', 'ready', 'picked_up'
 *    - Giorni futuri (30/01): SOLO 'pending'
 * 
 * 3. COMPOSIZIONE PANINO (ordine):
 *    - OBBLIGATORIO: 1 bread (selezionato casualmente)
 *    - OPZIONALE:
 *      - meat: 0-2 (no duplicati)
 *      - cheese: 0-1
 *      - vegetable: 0-3 (no duplicati)
 *      - sauce: 0-2 (no duplicati)
 *      - other: 0-1
 * 
 * 4. SNAPSHOT INGREDIENTI:
 *    - Ogni ingrediente dell'ordine viene salvato in order_ingredients
 *    - Con name e category copiati al momento della creazione
 *    - Questo preserva lo stato storico dell'ordine
 * 
 * 5. VINCOLO CAPIENZA:
 *    - Max 10 ordini per time_slot (da config/panini.php)
 *    - Distribuiamo gli ordini per evitare di superare questo limite
 */
class OrderSeeder extends Seeder
{
    use WithoutModelEvents;

    // Range di ordini per utente nel mese
    private int $orderMinPerUser;
    private int $orderMaxPerUser;

    // Range di ordini per "sessione di acquisto"
    private int $ordersPerPurchaseMin;
    private int $ordersPerPurchaseMax;

    // Data di riferimento (oggi)
    private Carbon $today;

    // Max ordini per slot
    private int $maxOrdersPerSlot;

    // Ingredienti raggruppati per categoria
    private array $ingredientsByCategory = [];

    public function run(): void
    {
        // Carica configurazione
        $config = config('panini');
        $this->orderMinPerUser = $config['seeding']['user_orders_per_month_min'];
        $this->orderMaxPerUser = $config['seeding']['user_orders_per_month_max'];
        $this->ordersPerPurchaseMin = $config['seeding']['orders_per_purchase_min'];
        $this->ordersPerPurchaseMax = $config['seeding']['orders_per_purchase_max'];
        $this->maxOrdersPerSlot = $config['max_orders_per_slot'];
        $this->today = Carbon::parse('2026-01-29');

        // Carica tutti gli ingredienti raggruppati per categoria
        $this->loadIngredientsByCategory();

        /**
         * Recupera gli utenti NORMALI (non admin) che potranno fare ordini.
         * Dalla migration: role è il ruolo ('user' o 'admin').
         */
        $normalUsers = User::where('role', 'user')->get();

        /**
         * Itera su ogni utente e distribuisci gli ordini.
         */
        foreach ($normalUsers as $user) {
            $this->createOrdersForUser($user);
        }
    }

    /**
     * Carica gli ingredienti dal DB e li organizza per categoria.
     * 
     * Questo riduce le query nel loop principale e migliora le prestazioni.
     */
    private function loadIngredientsByCategory(): void
    {
        $allIngredients = Ingredient::where('is_available', true)->get();

        foreach ($allIngredients as $ingredient) {
            $category = $ingredient->category;
            if (!isset($this->ingredientsByCategory[$category])) {
                $this->ingredientsByCategory[$category] = [];
            }
            $this->ingredientsByCategory[$category][] = $ingredient;
        }
    }

    /**
     * Crea ordini per un singolo utente.
     * 
     * Distribuisce tra 8-12 ordini (da config) nel mese di gennaio,
     * con stati coerenti alla data.
     * 
     * @param User $user L'utente che farà gli ordini
     */
    private function createOrdersForUser(User $user): void
    {
        // Numero di ordini per questo utente questo mese
        $totalOrdersThisMonth = rand($this->orderMinPerUser, $this->orderMaxPerUser);

        // Genera giorni casuali in cui questo utente comprerà
        // Range: 1-30 gennaio 2026
        $purchaseDates = $this->generateRandomPurchaseDates($totalOrdersThisMonth);

        foreach ($purchaseDates as $purchaseDate) {
            /**
             * Per ogni data di acquisto, genera 1-2 ordini
             * (il vincolo di capienza viene controllato a livello di slot)
             */
            $ordersThisPurchase = rand($this->ordersPerPurchaseMin, $this->ordersPerPurchaseMax);

            for ($i = 0; $i < $ordersThisPurchase; $i++) {
                $this->createSingleOrder($user, $purchaseDate);
            }
        }
    }

    /**
     * Genera date casuali in cui l'utente farà ordini.
     * 
     * Massimo 1-2 ordini per data.
     * 
     * @param int $totalOrders Numero totale di ordini da distribuire
     * @return array Array di date Carbon
     */
    private function generateRandomPurchaseDates(int $totalOrders): array
    {
        $purchaseDates = [];
        $generated = 0;

        // Massimo 30 giorni
        for ($day = 1; $day <= 30 && $generated < $totalOrders; $day++) {
            $date = Carbon::parse("2026-01-{$day}");

            /**
             * Controlla se questo giorno ha working_days attivi.
             * Se no, non può haver ordini per questo giorno.
             */
            $hasActiveWorkingDay = WorkingDay::where('day', $date)
                ->where('is_active', true)
                ->exists();

            if (!$hasActiveWorkingDay) {
                continue;
            }

            // Probabilità del 40% che questo utente compri oggi
            if (rand(1, 100) <= 40 && $generated < $totalOrders) {
                $purchaseDates[] = $date;
                $generated++;
            }
        }

        // Se non abbiamo abbastanza date, aggiungi alcune random da giorni attivi
        if ($generated < $totalOrders) {
            $remainingNeeded = $totalOrders - $generated;
            $activeWorkingDays = WorkingDay::where('is_active', true)
                ->pluck('day')
                ->toArray();

            for ($i = 0; $i < $remainingNeeded && count($activeWorkingDays) > 0; $i++) {
                $randomDate = $activeWorkingDays[array_rand($activeWorkingDays)];
                $purchaseDates[] = Carbon::parse($randomDate);
            }
        }

        return array_slice($purchaseDates, 0, $totalOrders);
    }

    /**
     * Crea un singolo ordine per l'utente in una data specifica.
     * 
     * LOGICA:
     * 1. Cerca un working_day attivo per questa data
     * 2. Sceglie un time_slot con < 10 ordini
     * 3. Crea l'ordine con stato appropriato alla data
     * 4. Crea gli ingredienti snapshot
     * 
     * @param User $user
     * @param Carbon $purchaseDate
     */
    private function createSingleOrder(User $user, Carbon $purchaseDate): void
    {
        /**
         * Trova il working_day ATTIVO per questa data.
         * Se non esiste (es. weekend), l'ordine non può essere creato.
         */
        $workingDay = WorkingDay::where('day', $purchaseDate)
            ->where('is_active', true)
            ->first();

        if (!$workingDay) {
            return; // Non può creare ordini senza working_day attivo
        }

        /**
         * Sceglie un time_slot che ha < 10 ordini.
         * Se tutti gli slot sono pieni, salta questo ordine.
         */
        $slots = TimeSlot::where('working_day_id', $workingDay->id)->get();
        $availableSlot = null;

        foreach ($slots as $slot) {
            $orderCount = Order::where('time_slot_id', $slot->id)->count();
            if ($orderCount < $this->maxOrdersPerSlot) {
                $availableSlot = $slot;
                break;
            }
        }

        if (!$availableSlot) {
            return; // Nessuno slot disponibile per questo giorno
        }

        /**
         * Determina lo stato dell'ordine in base alla data:
         * 
         * - Giorni passati: 'ready' (70%) o 'picked_up' (30%)
         * - Giorno corrente: mix di stati
         * - Giorni futuri: 'pending'
         */
        $status = $this->determineOrderStatus($purchaseDate);

        /**
         * Genera gli ingredienti per il panino.
         * Rispetta il vincolo: 1 bread obbligatorio + altri ingredienti casuali.
         */
        $ingredientIds = $this->generateRandomSandwich();

        /**
         * Crea l'ordine nel database.
         * 
         * daily_number è incrementato per tracciare l'ordine del giorno.
         * Per semplicità, useremo un valore incrementale globale.
         */
        $order = Order::create([
            'user_id' => $user->id,
            'time_slot_id' => $availableSlot->id,
            'working_day_id' => $workingDay->id,
            'status' => $status,
            'daily_number' => Order::where('working_day_id', $workingDay->id)->count() + 1,
        ]);

        /**
         * Crea gli snapshot ingredienti nell'order_ingredients.
         * Copia name e category al momento della creazione per preservare lo storico.
         */
        $this->attachIngredientsToOrder($order, $ingredientIds);
    }

    /**
     * Determina lo stato appropriato per un ordine in base alla data.
     * 
     * REGOLE:
     * - Passato: 'ready' o 'picked_up'
     * - Corrente: mix di stati
     * - Futuro: 'pending' only
     * 
     * @param Carbon $date
     * @return string Stato dell'ordine
     */
    private function determineOrderStatus(Carbon $date): string
    {
        if ($date < $this->today) {
            // Giorno passato: 'ready' (70%) o 'picked_up' (30%)
            return rand(1, 100) <= 70 ? 'ready' : 'picked_up';
        } elseif ($date->isSameDay($this->today)) {
            // Giorno corrente: mix di stati
            $rand = rand(1, 100);
            if ($rand <= 25) return 'pending';
            if ($rand <= 50) return 'confirmed';
            if ($rand <= 75) return 'ready';
            return 'picked_up';
        } else {
            // Giorno futuro: solo 'pending'
            return 'pending';
        }
    }

    /**
     * Genera un panino casuale con:
     * - 1 bread obbligatorio
     * - 0-2 meat (no duplicati)
     * - 0-1 cheese
     * - 0-3 vegetable (no duplicati)
     * - 0-2 sauce (no duplicati)
     * - 0-1 other
     * 
     * @return array Array di ingredient IDs
     */
    private function generateRandomSandwich(): array
    {
        $ingredientIds = [];

        // 1 BREAD (obbligatorio)
        if (!empty($this->ingredientsByCategory['bread'])) {
            $bread = $this->ingredientsByCategory['bread'][array_rand($this->ingredientsByCategory['bread'])];
            $ingredientIds[] = $bread->id;
        }

        // 0-2 MEAT
        $meatCount = rand(0, 2);
        if ($meatCount > 0 && !empty($this->ingredientsByCategory['meat'])) {
            $meatIngredients = $this->ingredientsByCategory['meat'];
            for ($i = 0; $i < $meatCount && count($meatIngredients) > 0; $i++) {
                $key = array_rand($meatIngredients);
                $ingredientIds[] = $meatIngredients[$key]->id;
                unset($meatIngredients[$key]); // Evita duplicati
                $meatIngredients = array_values($meatIngredients);
            }
        }

        // 0-1 CHEESE
        if (rand(1, 100) <= 50 && !empty($this->ingredientsByCategory['cheese'])) {
            $cheese = $this->ingredientsByCategory['cheese'][array_rand($this->ingredientsByCategory['cheese'])];
            $ingredientIds[] = $cheese->id;
        }

        // 0-3 VEGETABLE
        $vegCount = rand(0, 3);
        if ($vegCount > 0 && !empty($this->ingredientsByCategory['vegetable'])) {
            $vegIngredients = $this->ingredientsByCategory['vegetable'];
            for ($i = 0; $i < $vegCount && count($vegIngredients) > 0; $i++) {
                $key = array_rand($vegIngredients);
                $ingredientIds[] = $vegIngredients[$key]->id;
                unset($vegIngredients[$key]); // Evita duplicati
                $vegIngredients = array_values($vegIngredients);
            }
        }

        // 0-2 SAUCE
        $sauceCount = rand(0, 2);
        if ($sauceCount > 0 && !empty($this->ingredientsByCategory['sauce'])) {
            $sauceIngredients = $this->ingredientsByCategory['sauce'];
            for ($i = 0; $i < $sauceCount && count($sauceIngredients) > 0; $i++) {
                $key = array_rand($sauceIngredients);
                $ingredientIds[] = $sauceIngredients[$key]->id;
                unset($sauceIngredients[$key]); // Evita duplicati
                $sauceIngredients = array_values($sauceIngredients);
            }
        }

        // 0-1 OTHER
        if (rand(1, 100) <= 40 && !empty($this->ingredientsByCategory['other'])) {
            $other = $this->ingredientsByCategory['other'][array_rand($this->ingredientsByCategory['other'])];
            $ingredientIds[] = $other->id;
        }

        return $ingredientIds;
    }

    /**
     * Associa gli ingredienti all'ordine tramite tabella pivot order_ingredients.
     * 
     * Copia name e category degli ingredienti al momento della creazione
     * per preservare lo storico (snapshot immutabile).
     * 
     * @param Order $order
     * @param array $ingredientIds Array di ingredient IDs
     */
    private function attachIngredientsToOrder(Order $order, array $ingredientIds): void
    {
        foreach ($ingredientIds as $ingredientId) {
            $ingredient = Ingredient::find($ingredientId);

            if ($ingredient) {
                OrderIngredient::create([
                    'order_id' => $order->id,
                    'name' => $ingredient->name, // Snapshot del nome
                    'category' => $ingredient->category, // Snapshot della categoria
                ]);
            }
        }
    }
}