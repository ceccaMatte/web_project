<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\WorkingDay;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test per l'endpoint API della Home page.
 *
 * VERIFICA:
 * - Struttura JSON corretta
 * - Comportamento per utenti autenticati e guest
 * - Calcolo corretto delle varianti ordersPreview
 * - Dati scheduler e booking corretti
 */
class HomeApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Struttura base della response per guest user.
     */
    public function test_home_api_structure_for_guest()
    {
        $response = $this->getJson('/api/home');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['authenticated', 'enabled', 'name'],
                'todayService' => ['status', 'location', 'startTime', 'endTime', 'queueTime'],
                'scheduler' => [
                    'selectedDayId',
                    'monthLabel',
                    'weekDays' => [
                        '*' => ['id', 'weekday', 'dayNumber', 'isToday', 'isActive', 'isDisabled', 'isSelected']
                    ]
                ],
                'ordersPreview' => ['variant', 'ordersCount', 'selectedOrder'],
                'booking' => [
                    'dateLabel',
                    'locationLabel',
                    'slots' => [
                        '*' => ['id', 'timeLabel', 'slotsLeft', 'href', 'isDisabled']
                    ]
                ]
            ]);

        // Verifica valori per guest
        $response->assertJson([
            'user' => [
                'authenticated' => false,
                'enabled' => false,
                'name' => null,
            ],
            'ordersPreview' => [
                'variant' => 'login-cta',
                'ordersCount' => 0,
                'selectedOrder' => null,
            ]
        ]);
    }

    /**
     * Test: Response per utente autenticato senza ordini.
     */
    public function test_home_api_for_authenticated_user_without_orders()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/home');

        $response->assertJson([
            'user' => [
                'authenticated' => true,
                'enabled' => true,
                'name' => $user->name,
            ],
            'ordersPreview' => [
                'variant' => 'empty',
                'ordersCount' => 0,
                'selectedOrder' => null,
            ]
        ]);
    }

    /**
     * Test: Response per utente con un ordine.
     */
    public function test_home_api_for_user_with_single_order()
    {
        $user = User::factory()->create();
        $today = now()->toDateString();
        $workingDay = WorkingDay::factory()->create([
            'day' => $today,
            'is_active' => true,
        ]);
        $timeSlot = TimeSlot::factory()->create(['working_day_id' => $workingDay->id]);
        $order = Order::factory()->create([
            'user_id' => $user->id,
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 5,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($user)->getJson('/api/home');

        $response->assertJson([
            'ordersPreview' => [
                'variant' => 'single',
                'ordersCount' => 1,
                'selectedOrder' => [
                    'id' => $order->id,
                    'dailyNumber' => 5,
                    'status' => 'confirmed',
                    'statusLabel' => 'CONFIRMED',
                ]
            ]
        ]);
    }

    /**
     * Test: Response per utente con ordini multipli (selezione del più rilevante).
     */
    public function test_home_api_for_user_with_multiple_orders_selects_most_relevant()
    {
        $user = User::factory()->create();
        $workingDay = WorkingDay::factory()->create([
            'day' => now()->toDateString(),
            'is_active' => true,
        ]);
        $timeSlot = TimeSlot::factory()->create(['working_day_id' => $workingDay->id]);

        // Creiamo ordini con priorità diverse
        $order1 = Order::factory()->create([
            'user_id' => $user->id,
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 1,
            'status' => 'pending', // Priorità bassa
        ]);
        $order2 = Order::factory()->create([
            'user_id' => $user->id,
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 2,
            'status' => 'ready', // Priorità alta
        ]);

        $response = $this->actingAs($user)->getJson('/api/home');

        $response->assertJson([
            'ordersPreview' => [
                'variant' => 'multi',
                'ordersCount' => 2,
                'selectedOrder' => [
                    'id' => $order2->id, // Dovrebbe selezionare quello con priorità più alta
                    'dailyNumber' => 2,
                    'status' => 'ready',
                    'statusLabel' => 'READY AT 12:00',
                ]
            ]
        ]);
    }

    /**
     * Test: Sezione todayService mostra dati corretti quando attivo.
     */
    public function test_today_service_section_when_active()
    {
        $workingDay = WorkingDay::factory()->create([
            'day' => now()->toDateString(),
            'is_active' => true,
            'location' => 'Test Hub',
            'start_time' => '10:00',
            'end_time' => '14:00',
        ]);

        // Creiamo alcuni ordini attivi
        $timeSlot = TimeSlot::factory()->create(['working_day_id' => $workingDay->id]);
        Order::factory()->create([
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 1,
            'status' => 'confirmed',
        ]);
        Order::factory()->create([
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 2,
            'status' => 'confirmed',
        ]);
        Order::factory()->create([
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 3,
            'status' => 'confirmed',
        ]);

        $response = $this->getJson('/api/home');

        $response->assertJson([
            'todayService' => [
                'status' => 'active',
                'location' => 'Test Hub',
                'startTime' => '10:00',
                'endTime' => '14:00',
                'queueTime' => 3, // 3 ordini attivi
            ]
        ]);
    }

    /**
     * Test: Sezione booking mostra slot di domani.
     */
    public function test_booking_section_shows_tomorrow_slots()
    {
        $tomorrow = now()->addDay();
        $workingDay = WorkingDay::factory()->create([
            'day' => $tomorrow->toDateString(),
            'is_active' => true,
            'location' => 'Tomorrow Hub',
            'max_orders' => 5,
        ]);

        $timeSlot = TimeSlot::factory()->create([
            'working_day_id' => $workingDay->id,
            'start_time' => '12:00',
        ]);

        $response = $this->getJson('/api/home');

        $response->assertJson([
            'booking' => [
                'dateLabel' => 'Tomorrow, ' . $tomorrow->format('F j'),
                'locationLabel' => 'Tomorrow Hub',
                'slots' => [
                    [
                        'id' => $timeSlot->id,
                        'timeLabel' => '12:00',
                        'slotsLeft' => 5,
                        'href' => '/login', // Guest user
                        'isDisabled' => false,
                    ]
                ]
            ]
        ]);
    }
}
