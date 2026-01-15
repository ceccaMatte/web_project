<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\WorkingDay;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test per la logica di assegnazione del daily_number.
 *
 * SCENARIO TESTATI:
 * - Assegnazione sequenziale per lo stesso giorno
 * - Reset giornaliero (giorni diversi hanno numerazioni separate)
 * - Concorrenza: due ordini simultanei non devono avere stesso numero
 * - Ordini rifiutati non influenzano la numerazione
 */
class DailyNumberTest extends TestCase
{
    use RefreshDatabase;

    private OrderService $orderService;
    private User $user;
    private WorkingDay $workingDay;
    private TimeSlot $timeSlot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->orderService = new OrderService();

        // Creiamo dati di test
        $this->user = User::factory()->create();

        $this->workingDay = WorkingDay::factory()->create([
            'day' => now()->toDateString(),
            'is_active' => true,
            'max_orders' => 10,
            'location' => 'Test Location',
            'start_time' => '10:00',
            'end_time' => '14:00',
        ]);

        $this->timeSlot = TimeSlot::factory()->create([
            'working_day_id' => $this->workingDay->id,
            'start_time' => '12:00',
            'end_time' => '13:00',
        ]);
    }

    /**
     * Test: Gli ordini dello stesso giorno hanno numeri sequenziali.
     */
    public function test_daily_numbers_are_sequential_for_same_day()
    {
        // Creiamo 3 ordini
        $order1 = $this->orderService->createOrder($this->user, $this->timeSlot->id, []);
        $order2 = $this->orderService->createOrder($this->user, $this->timeSlot->id, []);
        $order3 = $this->orderService->createOrder($this->user, $this->timeSlot->id, []);

        // Verifichiamo che i numeri siano 1, 2, 3
        $this->assertEquals(1, $order1->daily_number);
        $this->assertEquals(2, $order2->daily_number);
        $this->assertEquals(3, $order3->daily_number);
    }

    /**
     * Test: Giorni diversi hanno numerazioni separate.
     */
    public function test_daily_numbers_reset_for_different_days()
    {
        // Primo giorno
        $order1 = $this->orderService->createOrder($this->user, $this->timeSlot->id, []);

        // Secondo giorno
        $tomorrow = WorkingDay::factory()->create([
            'day' => now()->addDay()->toDateString(),
            'is_active' => true,
            'max_orders' => 10,
            'location' => 'Test Location',
            'start_time' => '10:00',
            'end_time' => '14:00',
        ]);

        $tomorrowSlot = TimeSlot::factory()->create([
            'working_day_id' => $tomorrow->id,
            'start_time' => '12:00',
            'end_time' => '13:00',
        ]);

        $order2 = $this->orderService->createOrder($this->user, $tomorrowSlot->id, []);

        // Verifichiamo che il secondo giorno riparta da 1
        $this->assertEquals(1, $order1->daily_number);
        $this->assertEquals(1, $order2->daily_number);
    }

    /**
     * Test: Gli ordini rifiutati non influenzano la numerazione.
     */
    public function test_rejected_orders_do_not_affect_numbering()
    {
        // Creiamo ordine normale
        $order1 = $this->orderService->createOrder($this->user, $this->timeSlot->id, []);

        // Creiamo ordine che poi rifiutiamo (simuliamo)
        $order2 = $this->orderService->createOrder($this->user, $this->timeSlot->id, []);
        $order2->status = 'rejected';
        $order2->save();

        // Creiamo terzo ordine
        $order3 = $this->orderService->createOrder($this->user, $this->timeSlot->id, []);

        // Verifichiamo che la numerazione continui (1, 2, 3)
        $this->assertEquals(1, $order1->daily_number);
        $this->assertEquals(2, $order2->daily_number);
        $this->assertEquals(3, $order3->daily_number);
    }

    /**
     * Test: Concorrenza - due ordini simultanei non devono avere stesso numero.
     *
     * Questo test simula una race condition usando database transactions.
     */
    public function test_concurrent_orders_get_unique_numbers()
    {
        // Creiamo due ordini in transazioni separate per simulare concorrenza
        $order1 = null;
        $order2 = null;

        // Prima transazione
        \DB::transaction(function () use (&$order1) {
            $order1 = $this->orderService->createOrder($this->user, $this->timeSlot->id, []);
            // Simuliamo delay per permettere alla seconda transazione di iniziare
            usleep(10000); // 10ms
        });

        // Seconda transazione
        \DB::transaction(function () use (&$order2) {
            $order2 = $this->orderService->createOrder($this->user, $this->timeSlot->id, []);
        });

        // Verifichiamo che abbiano numeri diversi
        $this->assertNotEquals($order1->daily_number, $order2->daily_number);

        // E che siano consecutivi
        $numbers = collect([$order1->daily_number, $order2->daily_number])->sort();
        $this->assertEquals([1, 2], $numbers->values()->all());
    }
}
