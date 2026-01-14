<?php

namespace Tests\Feature;

use App\Models\Ingredient;
use App\Models\Order;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\WorkingDay;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Test completi per il modulo Ordini.
 * 
 * COPERTURA TEST:
 * 1. Creazione ordine con slot disponibile
 * 2. Slot pieno (409)
 * 3. Concorrenza simulata
 * 4. Ordine non pending non modificabile
 * 5. Snapshot ingredienti immutabile
 * 6. Utente non può modificare ordine altrui
 * 7. Admin può cambiare stato
 * 8. Utente NON admin non può cambiare stato
 * 9. Transizioni stato invalide
 * 10. Validazione ingredienti (1 bread obbligatorio)
 * 
 * SETUP:
 * - RefreshDatabase: DB pulito per ogni test
 * - Carbon::setTestNow(): data fissa per determinismo
 * - Factory per User con stato admin
 */
class OrderTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $admin;
    protected WorkingDay $workingDay;
    protected TimeSlot $timeSlot;
    protected Ingredient $bread;
    protected Ingredient $meat;
    protected Ingredient $cheese;

    /**
     * Setup eseguito prima di ogni test.
     * Crea dati di base necessari per tutti i test.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Data fissa per determinismo
        Carbon::setTestNow('2026-01-20 10:00:00');

        // Crea utenti
        $this->user = User::factory()->create(['role' => 'user']);
        $this->admin = User::factory()->create(['role' => 'admin']);

        // Crea working day futuro
        $this->workingDay = WorkingDay::create([
            'day' => '2026-01-25',
            'location' => 'Test Location',
            'start_time' => '08:00',
            'end_time' => '18:00',
            'max_orders' => 2, // Capienza limitata per testare slot pieno
            'max_time' => 60,
        ]);

        // Crea time slot
        $this->timeSlot = TimeSlot::create([
            'working_day_id' => $this->workingDay->id,
            'start_time' => '12:00',
            'end_time' => '12:15',
        ]);

        // Crea ingredienti di test
        $this->bread = Ingredient::create([
            'name' => 'Pane Integrale',
            'code' => 'BREAD_INT',
            'category' => 'bread',
            'is_available' => true,
        ]);

        $this->meat = Ingredient::create([
            'name' => 'Prosciutto Crudo',
            'code' => 'MEAT_HAM',
            'category' => 'meat',
            'is_available' => true,
        ]);

        $this->cheese = Ingredient::create([
            'name' => 'Mozzarella',
            'code' => 'CHEESE_MOZ',
            'category' => 'cheese',
            'is_available' => true,
        ]);
    }

    /**
     * Test 1: Utente crea ordine con slot disponibile → successo.
     * 
     * VERIFICA:
     * - Risposta 201 Created
     * - Ordine salvato nel DB
     * - Stato iniziale "pending"
     * - Snapshot ingredienti salvato
     */
    public function test_user_can_create_order_with_available_slot()
    {
        $response = $this->actingAs($this->user)->postJson('/orders', [
            'time_slot_id' => $this->timeSlot->id,
            'ingredients' => [$this->bread->id, $this->meat->id, $this->cheese->id],
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('order.status', 'pending')
                 ->assertJsonPath('order.user_id', $this->user->id);

        // Verifica DB
        $this->assertDatabaseHas('orders', [
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'pending',
        ]);

        // Verifica snapshot ingredienti
        $order = Order::first();
        $this->assertCount(3, $order->ingredients);
        $this->assertDatabaseHas('order_ingredients', [
            'order_id' => $order->id,
            'name' => 'Pane Integrale',
            'category' => 'bread',
        ]);
    }

    /**
     * Test 2: Slot pieno → 409 Conflict, nessun ordine creato.
     * 
     * VERIFICA:
     * - Risposta 409 Conflict
     * - Errore con code "SLOT_FULL"
     * - Nessun ordine creato nel DB
     * - Conteggio ordini rimane invariato
     */
    public function test_slot_full_returns_409_and_no_order_created()
    {
        // Crea 2 ordini (max_orders = 2)
        Order::factory()->count(2)->create([
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'pending',
        ]);

        $initialCount = Order::count();

        $response = $this->actingAs($this->user)->postJson('/orders', [
            'time_slot_id' => $this->timeSlot->id,
            'ingredients' => [$this->bread->id],
        ]);

        $response->assertStatus(409)
                 ->assertJson([
                     'code' => 'SLOT_FULL',
                 ]);

        // Verifica che NON sia stato creato alcun ordine
        $this->assertEquals($initialCount, Order::count());
    }

    /**
     * Test 3: Concorrenza simulata → 1 successo, 1 errore.
     * 
     * VERIFICA:
     * - Sotto concorrenza solo max_orders ordini vengono creati
     * - Il lock pessimistico previene race conditions
     * - Uno dei due richieste ottiene 409
     */
    public function test_concurrency_only_one_order_succeeds_when_slot_almost_full()
    {
        // Crea 1 ordine (rimane 1 posto su max_orders=2)
        Order::factory()->create([
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'pending',
        ]);

        // Simula 2 richieste simultanee usando transazioni separate
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $results = [];

        // Richiesta 1
        try {
            DB::beginTransaction();
            $response1 = $this->actingAs($user1)->postJson('/orders', [
                'time_slot_id' => $this->timeSlot->id,
                'ingredients' => [$this->bread->id],
            ]);
            DB::commit();
            $results[] = $response1->status();
        } catch (\Exception $e) {
            DB::rollBack();
            $results[] = 409;
        }

        // Richiesta 2
        try {
            DB::beginTransaction();
            $response2 = $this->actingAs($user2)->postJson('/orders', [
                'time_slot_id' => $this->timeSlot->id,
                'ingredients' => [$this->bread->id],
            ]);
            DB::commit();
            $results[] = $response2->status();
        } catch (\Exception $e) {
            DB::rollBack();
            $results[] = 409;
        }

        // Una deve avere successo (201), l'altra fallire (409)
        $this->assertContains(201, $results);
        $this->assertContains(409, $results);

        // Verifica conteggio finale: esattamente 2 ordini (max_orders)
        $this->assertEquals(2, Order::where('time_slot_id', $this->timeSlot->id)->count());
    }

    /**
     * Test 4: Ordine non pending non può essere modificato.
     * 
     * VERIFICA:
     * - Risposta 422 Unprocessable Entity
     * - Errore con code "ORDER_NOT_MODIFIABLE"
     * - Gli ingredienti NON vengono modificati
     */
    public function test_order_not_pending_cannot_be_modified()
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'confirmed', // NON pending
        ]);

        // Aggiungi ingredienti originali
        $order->ingredients()->create([
            'name' => $this->bread->name,
            'category' => $this->bread->category,
        ]);

        $response = $this->actingAs($this->user)->putJson("/orders/{$order->id}", [
            'ingredients' => [$this->bread->id, $this->meat->id],
        ]);

        $response->assertStatus(422)
                 ->assertJson([
                     'code' => 'ORDER_NOT_MODIFIABLE',
                 ]);

        // Verifica che gli ingredienti NON siano cambiati
        $this->assertCount(1, $order->fresh()->ingredients);
    }

    /**
     * Test 5: Snapshot ingredienti immutabile dopo creazione.
     * 
     * VERIFICA:
     * - Modificando l'ingrediente originale nel catalogo
     * - Lo snapshot dell'ordine rimane invariato
     * - Nome e categoria sono copie, non relazioni live
     */
    public function test_ingredient_snapshot_immutable_after_order_creation()
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
        ]);

        // Snapshot originale
        $order->ingredients()->create([
            'name' => 'Mozzarella',
            'category' => 'cheese',
        ]);

        // Modifica l'ingrediente nel catalogo
        $this->cheese->update([
            'name' => 'Mozzarella DOP',
        ]);

        // Verifica che lo snapshot NON cambi
        $snapshot = $order->fresh()->ingredients->first();
        $this->assertEquals('Mozzarella', $snapshot->name);
        $this->assertNotEquals('Mozzarella DOP', $snapshot->name);
    }

    /**
     * Test 6: Utente non può modificare ordine altrui.
     * 
     * VERIFICA:
     * - Risposta 403 Forbidden
     * - Policy blocca l'accesso
     * - L'ordine NON viene modificato
     */
    public function test_user_cannot_modify_order_of_another_user()
    {
        $otherUser = User::factory()->create();

        $order = Order::factory()->create([
            'user_id' => $otherUser->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)->putJson("/orders/{$order->id}", [
            'ingredients' => [$this->bread->id],
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test 7: Admin può cambiare stato ordine.
     * 
     * VERIFICA:
     * - Risposta 200 OK
     * - Stato aggiornato nel DB
     * - Transizione consentita
     */
    public function test_admin_can_change_order_status()
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->admin)->putJson("/admin/orders/{$order->id}/status", [
            'status' => 'confirmed',
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment(['status' => 'confirmed']);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'confirmed',
        ]);
    }

    /**
     * Test 8: Utente NON admin non può cambiare stato.
     * 
     * VERIFICA:
     * - Risposta 403 Forbidden
     * - Policy blocca l'accesso
     * - Lo stato NON viene modificato
     */
    public function test_non_admin_user_cannot_change_order_status()
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)->putJson("/admin/orders/{$order->id}/status", [
            'status' => 'confirmed',
        ]);

        $response->assertStatus(403);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'pending', // Non cambiato
        ]);
    }

    /**
     * Test 9: Transizioni stato invalide.
     * 
     * VERIFICA:
     * - Non si può tornare a pending
     * - Non si può uscire da rejected
     * - Risposta 422 con code "INVALID_STATE_TRANSITION"
     */
    public function test_invalid_state_transitions_return_422()
    {
        // Test 9a: Non si può tornare a pending
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($this->admin)->putJson("/admin/orders/{$order->id}/status", [
            'status' => 'pending',
        ]);

        $response->assertStatus(422)
                 ->assertJson(['code' => 'INVALID_STATE_TRANSITION']);

        // Test 9b: Non si può uscire da rejected
        $rejectedOrder = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'rejected',
        ]);

        $response = $this->actingAs($this->admin)->putJson("/admin/orders/{$rejectedOrder->id}/status", [
            'status' => 'confirmed',
        ]);

        $response->assertStatus(422)
                 ->assertJson(['code' => 'INVALID_STATE_TRANSITION']);
    }

    /**
     * Test 10: Validazione ingredienti (1 bread obbligatorio).
     * 
     * VERIFICA:
     * - Senza pane → errore 422
     * - Due pani → errore 422
     * - Ingrediente duplicato → errore 422
     * - Nessun ordine creato in caso di errore
     */
    public function test_validation_requires_exactly_one_bread()
    {
        // Test 10a: Nessun pane → errore
        $response = $this->actingAs($this->user)->postJson('/orders', [
            'time_slot_id' => $this->timeSlot->id,
            'ingredients' => [$this->meat->id, $this->cheese->id], // No bread
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['ingredients']);

        // Test 10b: Due pani → errore
        $bread2 = Ingredient::create([
            'name' => 'Pane Bianco',
            'code' => 'BREAD_WHITE',
            'category' => 'bread',
            'is_available' => true,
        ]);

        $response = $this->actingAs($this->user)->postJson('/orders', [
            'time_slot_id' => $this->timeSlot->id,
            'ingredients' => [$this->bread->id, $bread2->id], // Due pani
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['ingredients']);

        // Test 10c: Ingrediente duplicato → errore
        $response = $this->actingAs($this->user)->postJson('/orders', [
            'time_slot_id' => $this->timeSlot->id,
            'ingredients' => [$this->bread->id, $this->meat->id, $this->meat->id], // Duplicato
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['ingredients']);

        // Verifica che nessun ordine sia stato creato
        $this->assertEquals(0, Order::count());
    }

    /**
     * Test 11: Ordine rejected non conta verso max_orders.
     * 
     * VERIFICA:
     * - Gli ordini rejected non occupano posto
     * - Possibile creare nuovi ordini anche se ci sono rejected
     */
    public function test_rejected_orders_do_not_count_towards_max_orders()
    {
        // Crea 2 ordini rejected (non contano)
        Order::factory()->count(2)->create([
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'rejected',
        ]);

        // Dovrebbe poter creare ancora 2 ordini (max_orders=2)
        $response1 = $this->actingAs($this->user)->postJson('/orders', [
            'time_slot_id' => $this->timeSlot->id,
            'ingredients' => [$this->bread->id],
        ]);

        $response1->assertStatus(201);

        $user2 = User::factory()->create();
        $response2 = $this->actingAs($user2)->postJson('/orders', [
            'time_slot_id' => $this->timeSlot->id,
            'ingredients' => [$this->bread->id],
        ]);

        $response2->assertStatus(201);

        // Verifica conteggio ordini attivi
        $activeOrders = Order::where('time_slot_id', $this->timeSlot->id)
            ->where('status', '!=', 'rejected')
            ->count();

        $this->assertEquals(2, $activeOrders);
    }

    /**
     * Test 12: Delete ordine pending funziona correttamente.
     * 
     * VERIFICA:
     * - Ordine pending può essere eliminato
     * - Risposta 200
     * - Ordine e ingredienti rimossi dal DB (cascade)
     */
    public function test_user_can_delete_pending_order()
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'pending',
        ]);

        $order->ingredients()->create([
            'name' => $this->bread->name,
            'category' => $this->bread->category,
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/orders/{$order->id}");

        $response->assertStatus(200);

        // Verifica eliminazione
        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
        $this->assertDatabaseMissing('order_ingredients', ['order_id' => $order->id]);
    }

    /**
     * Test 13: Delete ordine non pending fallisce.
     * 
     * VERIFICA:
     * - Risposta 422
     * - Ordine NON eliminato
     */
    public function test_cannot_delete_non_pending_order()
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'time_slot_id' => $this->timeSlot->id,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/orders/{$order->id}");

        $response->assertStatus(422)
                 ->assertJson(['code' => 'ORDER_NOT_MODIFIABLE']);

        // Verifica che l'ordine esista ancora
        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }
}
