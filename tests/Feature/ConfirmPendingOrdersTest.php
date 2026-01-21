<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\TimeSlot;
use App\Models\WorkingDay;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Test per il comando ConfirmPendingOrders.
 * 
 * Questi test verificano che la logica di conferma automatica
 * degli ordini funzioni correttamente in tutti gli scenari.
 * 
 * SCENARI TESTATI:
 * ================
 * 1. Ordine pending prima della deadline → resta pending
 * 2. Ordine pending alla deadline esatta → confirmed
 * 3. Ordine pending dopo la deadline → confirmed
 * 4. Ordine confirmed → NON modificato
 * 5. Ordine rejected → NON modificato
 * 6. Ordini di giorni futuri → NON modificati
 * 7. Ordini di giorni passati → NON modificati
 * 8. max_time = 0 → deadline coincide con slot_time
 */
class ConfirmPendingOrdersTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Helper per creare un ordine con i dati necessari per il test.
     * 
     * @param string $status Stato dell'ordine
     * @param Carbon $day Data del working day
     * @param string $slotStartTime Orario di inizio slot (HH:MM:SS)
     * @param int|null $maxTime Minuti di anticipo massimo
     * @return Order
     */
    private function createOrderWithSlot(
        string $status,
        Carbon $day,
        string $slotStartTime,
        ?int $maxTime
    ): Order {
        // Usiamo la factory per creare il WorkingDay con tutti i campi richiesti
        // Se maxTime è null, usiamo 0 come fallback (il DB non accetta NULL)
        $workingDay = WorkingDay::factory()->create([
            'day' => $day->toDateString(),
            'max_time' => $maxTime ?? 0,
        ]);

        // Creiamo il TimeSlot con la factory
        $timeSlot = TimeSlot::factory()->create([
            'working_day_id' => $workingDay->id,
            'start_time' => $slotStartTime,
            'end_time' => Carbon::parse($slotStartTime)->addMinutes(15)->format('H:i:s'),
        ]);

        // Creiamo l'ordine con la factory
        $order = Order::factory()->create([
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'status' => $status,
        ]);

        return $order;
    }

    /**
     * TEST 1: Ordine pending PRIMA della deadline → resta pending.
     * 
     * Scenario:
     * - Slot: 12:00
     * - max_time: 30 minuti
     * - Deadline: 11:30
     * - NOW: 11:00 (30 minuti PRIMA della deadline)
     * 
     * Risultato atteso: l'ordine resta pending
     */
    public function test_pending_order_before_deadline_stays_pending(): void
    {
        // Impostiamo "now" a 11:00
        Carbon::setTestNow(Carbon::parse('2026-01-21 11:00:00'));

        $order = $this->createOrderWithSlot(
            status: 'pending',
            day: Carbon::parse('2026-01-21'),
            slotStartTime: '12:00:00',
            maxTime: 30 // deadline = 11:30
        );

        $this->artisan('orders:confirm-pending')
            ->assertSuccessful();

        $order->refresh();
        $this->assertEquals('pending', $order->status);
    }

    /**
     * TEST 2: Ordine pending ALLA deadline esatta → confirmed.
     * 
     * Scenario:
     * - Slot: 12:00
     * - max_time: 30 minuti
     * - Deadline: 11:30
     * - NOW: 11:30 (esattamente alla deadline)
     * 
     * Risultato atteso: l'ordine diventa confirmed
     */
    public function test_pending_order_at_exact_deadline_becomes_confirmed(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-21 11:30:00'));

        $order = $this->createOrderWithSlot(
            status: 'pending',
            day: Carbon::parse('2026-01-21'),
            slotStartTime: '12:00:00',
            maxTime: 30
        );

        $this->artisan('orders:confirm-pending')
            ->assertSuccessful();

        $order->refresh();
        $this->assertEquals('confirmed', $order->status);
    }

    /**
     * TEST 3: Ordine pending DOPO la deadline → confirmed.
     * 
     * Scenario:
     * - Slot: 12:00
     * - max_time: 30 minuti
     * - Deadline: 11:30
     * - NOW: 11:45 (15 minuti DOPO la deadline)
     * 
     * Risultato atteso: l'ordine diventa confirmed
     */
    public function test_pending_order_after_deadline_becomes_confirmed(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-21 11:45:00'));

        $order = $this->createOrderWithSlot(
            status: 'pending',
            day: Carbon::parse('2026-01-21'),
            slotStartTime: '12:00:00',
            maxTime: 30
        );

        $this->artisan('orders:confirm-pending')
            ->assertSuccessful();

        $order->refresh();
        $this->assertEquals('confirmed', $order->status);
    }

    /**
     * TEST 4: Ordine già confirmed → NON modificato.
     * 
     * Verifica l'IDEMPOTENZA del comando:
     * Un ordine già in stato 'confirmed' non deve essere toccato.
     */
    public function test_confirmed_order_is_not_modified(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-21 11:45:00'));

        $order = $this->createOrderWithSlot(
            status: 'confirmed', // Già confirmed
            day: Carbon::parse('2026-01-21'),
            slotStartTime: '12:00:00',
            maxTime: 30
        );

        $originalUpdatedAt = $order->updated_at;

        $this->artisan('orders:confirm-pending')
            ->assertSuccessful();

        $order->refresh();
        $this->assertEquals('confirmed', $order->status);
    }

    /**
     * TEST 5: Ordine rejected → NON modificato.
     * 
     * Un ordine rejected non deve MAI essere riportato a confirmed.
     * Questo test verifica che il comando rispetti le regole di stato.
     */
    public function test_rejected_order_is_not_modified(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-21 11:45:00'));

        $order = $this->createOrderWithSlot(
            status: 'rejected',
            day: Carbon::parse('2026-01-21'),
            slotStartTime: '12:00:00',
            maxTime: 30
        );

        $this->artisan('orders:confirm-pending')
            ->assertSuccessful();

        $order->refresh();
        $this->assertEquals('rejected', $order->status);
    }

    /**
     * TEST 6: Ordini di giorni FUTURI → NON modificati.
     * 
     * Il comando deve processare SOLO gli ordini del giorno corrente.
     * Gli ordini di giorni futuri devono essere ignorati.
     */
    public function test_orders_for_future_days_are_not_modified(): void
    {
        // Oggi è il 21, l'ordine è per il 22
        Carbon::setTestNow(Carbon::parse('2026-01-21 11:45:00'));

        $order = $this->createOrderWithSlot(
            status: 'pending',
            day: Carbon::parse('2026-01-22'), // DOMANI
            slotStartTime: '12:00:00',
            maxTime: 30
        );

        $this->artisan('orders:confirm-pending')
            ->assertSuccessful();

        $order->refresh();
        $this->assertEquals('pending', $order->status);
    }

    /**
     * TEST 7: Ordini di giorni PASSATI → NON modificati.
     * 
     * Il comando deve processare SOLO gli ordini del giorno corrente.
     * Gli ordini di giorni passati devono essere ignorati.
     */
    public function test_orders_for_past_days_are_not_modified(): void
    {
        // Oggi è il 21, l'ordine è per il 20
        Carbon::setTestNow(Carbon::parse('2026-01-21 11:45:00'));

        $order = $this->createOrderWithSlot(
            status: 'pending',
            day: Carbon::parse('2026-01-20'), // IERI
            slotStartTime: '12:00:00',
            maxTime: 30
        );

        $this->artisan('orders:confirm-pending')
            ->assertSuccessful();

        $order->refresh();
        $this->assertEquals('pending', $order->status);
    }

    /**
     * TEST 8: max_time = NULL → trattato come 0.
     * 
     * Quando max_time è NULL, la deadline coincide con lo slot_time.
     * 
     * Scenario:
     * - Slot: 12:00
     * - max_time: NULL (fallback a 0)
     * - Deadline: 12:00
     * - NOW: 12:00
     * 
     * Risultato atteso: l'ordine diventa confirmed
     */
    public function test_zero_max_time_is_treated_correctly(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-21 12:00:00'));

        $order = $this->createOrderWithSlot(
            status: 'pending',
            day: Carbon::parse('2026-01-21'),
            slotStartTime: '12:00:00',
            maxTime: null // NULL → trattato come 0
        );

        $this->artisan('orders:confirm-pending')
            ->assertSuccessful();

        $order->refresh();
        $this->assertEquals('confirmed', $order->status);
    }
}
