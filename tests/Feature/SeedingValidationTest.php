<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Ingredient;
use App\Models\WorkingDay;
use App\Models\TimeSlot;
use App\Models\Order;
use App\Models\OrderIngredient;
use App\Models\FavoriteSandwich;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test di validazione per il seeding del "Campus Truck / Paninaro".
 * 
 * Verifica che:
 * - I seeders abbiano creato i dati secondo le specifiche
 * - I vincoli di business siano rispettati
 * - Non ci siano incoerenze nei dati
 * 
 * NOTA: Usa RefreshDatabase per migrare il test DB e scaricare i dati.
 * Esegue il seeding manualmente nei test.
 */
class SeedingValidationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Esegui il seeding prima di ogni test.
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // Esegui il seeding per popolare il database di test
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
    }

    /**
     * Test: Utenti creati correttamente.
     */
    public function test_users_are_created_correctly(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $user = User::where('email', "user{$i}@test.it")->first();
            $this->assertNotNull($user);
            $this->assertEquals('user', $user->role);
        }

        $admin = User::where('email', 'admin@test.it')->first();
        $this->assertNotNull($admin);
        $this->assertEquals('admin', $admin->role);
        $this->assertEquals(6, User::count());
    }

    /**
     * Test: Ingredienti creati per tutte le categorie.
     */
    public function test_ingredients_are_populated_correctly(): void
    {
        $categories = ['bread', 'meat', 'cheese', 'vegetable', 'sauce', 'other'];

        foreach ($categories as $category) {
            $count = Ingredient::where('category', $category)->count();
            $this->assertGreaterThanOrEqual(4, $count);
        }

        $this->assertNotNull(Ingredient::where('name', 'Cotoletta di Pollo')->first());
        $this->assertNotNull(Ingredient::where('name', 'Rucola')->first());
        $this->assertNotNull(Ingredient::where('name', 'Olio')->first());
    }

    /**
     * Test: Working days creati correttamente.
     */
    public function test_working_days_are_created_correctly(): void
    {
        $workingDays = WorkingDay::all();
        foreach ($workingDays as $wd) {
            $dayOfWeek = Carbon::parse($wd->day)->dayOfWeek;
            $this->assertNotEquals(0, $dayOfWeek); // No domenica
            $this->assertNotEquals(6, $dayOfWeek); // No sabato
        }

        foreach ($workingDays as $wd) {
            $this->assertEquals('Campus - Unibo Cesena', $wd->location);
        }

        $suspendedInCurrentWeek = WorkingDay::whereBetween('day', [
            Carbon::parse('2026-01-26'),
            Carbon::parse('2026-01-30')
        ])->where('is_active', false)->count();
        $this->assertEquals(0, $suspendedInCurrentWeek);
    }

    /**
     * Test: Time slots generati correttamente.
     */
    public function test_time_slots_are_generated_correctly(): void
    {
        $config = config('panini');
        $slotDuration = $config['time_slot_minutes'];

        $slots = TimeSlot::all();
        foreach ($slots as $slot) {
            $startParts = explode(':', $slot->start_time);
            $startMinutes = (int)$startParts[0] * 60 + (int)$startParts[1];

            $endParts = explode(':', $slot->end_time);
            $endMinutes = (int)$endParts[0] * 60 + (int)$endParts[1];

            $duration = $endMinutes - $startMinutes;
            $this->assertEquals($slotDuration, $duration);
        }

        $suspendedWorkingDays = WorkingDay::where('is_active', false)->get();
        foreach ($suspendedWorkingDays as $wd) {
            $slotCount = TimeSlot::where('working_day_id', $wd->id)->count();
            $this->assertEquals(0, $slotCount);
        }
    }

    /**
     * Test: Ordini non hanno status 'rejected'.
     */
    public function test_no_orders_have_rejected_status(): void
    {
        $rejectedOrders = Order::where('status', 'rejected')->count();
        $this->assertEquals(0, $rejectedOrders);
    }

    /**
     * Test: Ordini nel passato hanno stati corretti.
     */
    public function test_past_orders_have_correct_status(): void
    {
        $today = Carbon::parse('2026-01-29');
        $pastOrders = Order::whereHas('workingDay', function ($query) use ($today) {
            $query->where('day', '<', $today);
        })->get();

        foreach ($pastOrders as $order) {
            $this->assertContains($order->status, ['ready', 'picked_up']);
        }
    }

    /**
     * Test: Ordini nel futuro hanno status 'pending'.
     */
    public function test_future_orders_have_pending_status(): void
    {
        $today = Carbon::parse('2026-01-29');
        $futureOrders = Order::whereHas('workingDay', function ($query) use ($today) {
            $query->where('day', '>', $today);
        })->get();

        foreach ($futureOrders as $order) {
            $this->assertEquals('pending', $order->status);
        }
    }

    /**
     * Test: Ogni ordine ha ESATTAMENTE 1 ingrediente bread.
     */
    public function test_every_order_has_exactly_one_bread(): void
    {
        $orders = Order::all();

        foreach ($orders as $order) {
            $breadCount = OrderIngredient::where('order_id', $order->id)
                ->where('category', 'bread')
                ->count();

            $this->assertEquals(1, $breadCount);
        }
    }

    /**
     * Test: Nessun slot supera max ordini.
     */
    public function test_no_slot_exceeds_max_orders(): void
    {
        $config = config('panini');
        $maxOrdersPerSlot = $config['max_orders_per_slot'];

        $slots = TimeSlot::withCount('orders')->get();

        foreach ($slots as $slot) {
            $this->assertLessThanOrEqual($maxOrdersPerSlot, $slot->orders_count);
        }
    }

    /**
     * Test: Ordini solo in giorni lavorativi attivi.
     */
    public function test_orders_only_exist_on_active_working_days(): void
    {
        $orders = Order::all();

        foreach ($orders as $order) {
            $wd = $order->workingDay;
            $this->assertTrue($wd && $wd->is_active);
        }
    }

    /**
     * Test: Ogni utente ha 5-7 panini preferiti.
     */
    public function test_each_user_has_favorite_sandwiches(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            $favoritesCount = FavoriteSandwich::where('user_id', $user->id)->count();
            $this->assertGreaterThanOrEqual(5, $favoritesCount);
            $this->assertLessThanOrEqual(7, $favoritesCount);
        }
    }

    /**
     * Test: Ogni panino preferito ha esattamente 1 bread.
     */
    public function test_favorite_sandwiches_have_exactly_one_bread(): void
    {
        $favorites = FavoriteSandwich::all();

        foreach ($favorites as $favorite) {
            $breadCount = $favorite->ingredients()
                ->where('category', 'bread')
                ->count();

            $this->assertEquals(1, $breadCount);
        }
    }

    /**
     * Test: Configuration ID è valido.
     */
    public function test_favorite_sandwich_configuration_ids_are_valid(): void
    {
        $favorites = FavoriteSandwich::all();

        foreach ($favorites as $favorite) {
            $this->assertNotNull($favorite->ingredient_configuration_id);
            $this->assertEquals(16, strlen($favorite->ingredient_configuration_id));
        }
    }
}
