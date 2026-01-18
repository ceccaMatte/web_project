<?php

namespace Tests\Feature;

use App\Constants\Role;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\WorkingDay;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test per il controller AdminWorkServiceController.
 * Verifica che la pagina Work Service funzioni correttamente
 * per admin autenticati, con tutti gli endpoint API.
 */
class AdminWorkServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $user;
    private WorkingDay $workingDay;
    private TimeSlot $timeSlot;

    /**
     * Setup per ogni test: crea utenti e dati di base.
     */
    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::create(2026, 1, 8, 10, 30)); // Giovedì 10:30

        $this->admin = User::factory()->admin()->create();
        $this->user = User::factory()->user()->create([
            'nickname' => 'TestUser',
        ]);

        // Crea working day per oggi
        $this->workingDay = WorkingDay::factory()->create([
            'day' => Carbon::today(),
            'start_time' => '08:00',
            'end_time' => '14:00',
            'is_active' => true,
        ]);

        // Crea time slot
        $this->timeSlot = TimeSlot::factory()->create([
            'working_day_id' => $this->workingDay->id,
            'start_time' => '10:00',
            'end_time' => '10:15',
        ]);
    }

    // ========================================
    // TEST: ACCESS CONTROL
    // ========================================

    /**
     * Test: utente guest non può accedere alla pagina.
     */
    public function test_guest_cannot_access_work_service_page(): void
    {
        $response = $this->get('/admin/work-service');
        $response->assertStatus(401); // AdminMiddleware returns 401, not redirect
    }

    /**
     * Test: utente normale non può accedere alla pagina.
     */
    public function test_user_cannot_access_work_service_page(): void
    {
        $response = $this->actingAs($this->user)->get('/admin/work-service');
        $response->assertStatus(403);
    }

    /**
     * Test: admin può accedere alla pagina.
     */
    public function test_admin_can_access_work_service_page(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/work-service');
        $response->assertStatus(200);
        $response->assertViewIs('pages.admin-work-service');
    }

    // ========================================
    // TEST: API GET DATA
    // ========================================

    /**
     * Test: guest non può accedere all'API.
     */
    public function test_guest_cannot_access_api(): void
    {
        $response = $this->getJson('/api/admin/work-service?date=2026-01-08');
        $response->assertStatus(401);
    }

    /**
     * Test: user normale non può accedere all'API.
     */
    public function test_user_cannot_access_api(): void
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/admin/work-service?date=2026-01-08');
        $response->assertStatus(403);
    }

    /**
     * Test: API restituisce struttura corretta.
     */
    public function test_api_returns_correct_structure(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/work-service?date=2026-01-08');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'date',
                'currentTimeSlotId',
                'timeSlots',
                'orders',
            ]);
    }

    /**
     * Test: API restituisce time slots formattati correttamente.
     */
    public function test_api_returns_formatted_time_slots(): void
    {
        // Crea un ordine nel time slot
        Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/work-service?date=2026-01-08');

        $response->assertStatus(200);

        $data = $response->json();
        $this->assertNotEmpty($data['timeSlots']);

        $slot = $data['timeSlots'][0];
        $this->assertArrayHasKey('id', $slot);
        $this->assertArrayHasKey('start_time', $slot);
        $this->assertArrayHasKey('end_time', $slot);
        $this->assertArrayHasKey('counts', $slot);
        $this->assertArrayHasKey('pending', $slot['counts']);
        $this->assertArrayHasKey('confirmed', $slot['counts']);
        $this->assertArrayHasKey('ready', $slot['counts']);
        $this->assertArrayHasKey('picked_up', $slot['counts']);
    }

    /**
     * Test: API restituisce ordini formattati correttamente.
     */
    public function test_api_returns_formatted_orders(): void
    {
        // Crea ordine 
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'confirmed',
            'daily_number' => 1,
        ]);

        // Crea snapshot ingredienti (OrderIngredient, non Ingredient)
        \App\Models\OrderIngredient::create([
            'order_id' => $order->id,
            'name' => 'Pane Bianco',
            'category' => 'bread',
        ]);

        \App\Models\OrderIngredient::create([
            'order_id' => $order->id,
            'name' => 'Prosciutto',
            'category' => 'meat',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/work-service?date=2026-01-08');

        $response->assertStatus(200);

        $data = $response->json();
        $this->assertNotEmpty($data['orders']);

        $returnedOrder = $data['orders'][0];
        $this->assertEquals($order->id, $returnedOrder['id']);
        $this->assertEquals(1, $returnedOrder['daily_number']);
        $this->assertEquals('confirmed', $returnedOrder['status']);
        $this->assertEquals('TestUser', $returnedOrder['user']['nickname']);
        $this->assertArrayHasKey('ingredients', $returnedOrder);
    }

    /**
     * Test: API non include ordini rejected.
     */
    public function test_api_excludes_rejected_orders(): void
    {
        Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'rejected',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/work-service?date=2026-01-08');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEmpty($data['orders']);
    }

    /**
     * Test: API richiede parametro date.
     */
    public function test_api_requires_date_parameter(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/work-service');

        $response->assertStatus(422);
    }

    // ========================================
    // TEST: API POLL
    // ========================================

    /**
     * Test: endpoint poll funziona come apiIndex.
     */
    public function test_poll_endpoint_returns_same_structure(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/work-service/poll?date=2026-01-08');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'date',
                'currentTimeSlotId',
                'timeSlots',
                'orders',
            ]);
    }

    // ========================================
    // TEST: CHANGE STATUS
    // ========================================

    /**
     * Test: guest non può cambiare stato.
     */
    public function test_guest_cannot_change_order_status(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'confirmed',
        ]);

        $response = $this->postJson("/api/admin/orders/{$order->id}/status", [
            'status' => 'ready',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test: user normale non può cambiare stato.
     */
    public function test_user_cannot_change_order_status(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'ready',
            ]);

        $response->assertStatus(403);
    }

    /**
     * Test: admin può cambiare stato ordine.
     */
    public function test_admin_can_change_order_status(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'ready',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'order' => [
                    'id' => $order->id,
                    'status' => 'ready',
                ],
            ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'ready',
        ]);
    }

    /**
     * Test: cambio stato confirmed → ready.
     */
    public function test_can_change_confirmed_to_ready(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'ready',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('ready', $order->fresh()->status);
    }

    /**
     * Test: cambio stato ready → picked_up.
     */
    public function test_can_change_ready_to_picked_up(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'ready',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'picked_up',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('picked_up', $order->fresh()->status);
    }

    /**
     * Test: stato non valido restituisce errore.
     */
    public function test_invalid_status_returns_error(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/orders/{$order->id}/status", [
                'status' => 'invalid_status',
            ]);

        $response->assertStatus(422);
    }

    /**
     * Test: ordine inesistente restituisce 404.
     */
    public function test_nonexistent_order_returns_404(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/orders/99999/status', [
                'status' => 'ready',
            ]);

        $response->assertStatus(404);
    }

    // ========================================
    // TEST: CURRENT TIME SLOT AUTO-SELECT
    // ========================================

    /**
     * Test: currentTimeSlotId è quello corrente in base all'orario.
     */
    public function test_current_time_slot_is_auto_selected(): void
    {
        // Ora è 10:30, il time slot 10:00-10:15 è passato
        // Creiamo un time slot che include l'ora attuale
        $currentSlot = TimeSlot::factory()->create([
            'working_day_id' => $this->workingDay->id,
            'start_time' => '10:15',
            'end_time' => '10:45',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/work-service?date=2026-01-08');

        $response->assertStatus(200);
        $data = $response->json();
        
        // Dovrebbe selezionare il time slot corrente
        $this->assertEquals($currentSlot->id, $data['currentTimeSlotId']);
    }

    // ========================================
    // TEST: ORDERS SORTED BY DAILY NUMBER
    // ========================================

    /**
     * Test: ordini sono ordinati per daily_number ASC.
     */
    public function test_orders_are_sorted_by_daily_number(): void
    {
        Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'working_day_id' => $this->workingDay->id,
            'status' => 'confirmed',
            'daily_number' => 3,
        ]);

        Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'working_day_id' => $this->workingDay->id,
            'status' => 'confirmed',
            'daily_number' => 1,
        ]);

        Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'working_day_id' => $this->workingDay->id,
            'status' => 'ready',
            'daily_number' => 2,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/work-service?date=2026-01-08');

        $data = $response->json();
        $dailyNumbers = array_column($data['orders'], 'daily_number');

        $this->assertEquals([1, 2, 3], $dailyNumbers);
    }

    // ========================================
    // TEST: EMPTY DAY
    // ========================================

    /**
     * Test: giorno senza working day restituisce array vuoti.
     */
    public function test_day_without_working_day_returns_empty(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/work-service?date=2026-01-20');

        $response->assertStatus(200);
        $data = $response->json();
        
        $this->assertEquals('2026-01-20', $data['date']);
        $this->assertNull($data['currentTimeSlotId']);
        $this->assertEmpty($data['timeSlots']);
        $this->assertEmpty($data['orders']);
    }
}
