<?php

namespace App\Services;

use App\Domain\Errors\InvalidOrderStateTransitionError;
use App\Domain\Errors\OrderNotModifiableError;
use App\Domain\Errors\SlotFullError;
use App\Domain\Errors\UnauthorizedOrderAccessError;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Service per la gestione degli ordini.
 * 
 * PERCHÉ ESISTE QUESTO SERVICE:
 * 
 * 1. SEPARAZIONE DELLE RESPONSABILITÀ
 *    - Il controller gestisce HTTP (request/response)
 *    - Il service contiene la logica di business
 *    - Il model rappresenta i dati
 * 
 * 2. TRANSAZIONI E CONCORRENZA
 *    - La creazione di un ordine deve essere atomica
 *    - Il lock sul time slot previene race conditions
 *    - Se fallisce qualcosa, viene fatto rollback automatico
 * 
 * 3. TESTABILITÀ
 *    - Posso testare il service senza simulare richieste HTTP
 *    - I test sono più veloci e focalizzati
 * 
 * 4. RIUTILIZZABILITÀ
 *    - Posso usare il service da:
 *      - Controller API
 *      - Command CLI
 *      - Job asincrono
 *      - Test
 * 
 * PERCHÉ LA CONCORRENZA È GESTITA NEL DB:
 * 
 * - lockForUpdate() crea un lock pessimistico a livello DB
 * - Due richieste simultanee NON possono leggere lo stesso slot contemporaneamente
 * - La seconda richiesta aspetta che la prima finisca la transazione
 * - Questo garantisce che max_orders sia sempre rispettato
 * 
 * SENZA IL LOCK:
 * 
 * Request A: conta 49 ordini, max=50 → OK, crea ordine
 * Request B: conta 49 ordini, max=50 → OK, crea ordine
 * Risultato: 51 ordini (ERRORE!)
 * 
 * CON IL LOCK:
 * 
 * Request A: lock + conta 49 → crea ordine → commit (50 ordini)
 * Request B: aspetta... lock + conta 50 → SlotFullError
 * Risultato: 50 ordini (CORRETTO!)
 */
class OrderService
{
    /**
     * Crea un nuovo ordine.
     * 
     * FLUSSO:
     * 
     * 1. Apre una transazione DB
     * 2. Fa lock sul time slot (previene race conditions)
     * 3. Carica il working_day per verificare max_orders
     * 4. Conta gli ordini esistenti sullo slot
     * 5. Se >= max_orders → lancia SlotFullError
     * 6. Altrimenti crea l'ordine in stato "pending"
     * 7. Salva gli ingredienti come snapshot
     * 8. Commit della transazione
     * 
     * SE QUALCOSA FALLISCE:
     * - Rollback automatico
     * - Nessun ordine creato
     * - Nessun dato parziale salvato
     * 
     * @param User $user L'utente che crea l'ordine
     * @param int $timeSlotId L'ID del time slot
     * @param array $ingredientIds Array di ID ingredienti da includere
     * @return Order L'ordine creato
     * @throws SlotFullError Se lo slot ha raggiunto max_orders
     * @throws \Exception Se mancano dati di configurazione
     */
    public function createOrder(User $user, int $timeSlotId, array $ingredientIds): Order
    {
        return DB::transaction(function () use ($user, $timeSlotId, $ingredientIds) {
            
            // STEP 1: Lock pessimistico sul time slot
            // Questo previene che due richieste simultanee leggano lo stesso conteggio
            $timeSlot = TimeSlot::lockForUpdate()->findOrFail($timeSlotId);

            // STEP 2: Carica il working_day con il max_orders
            // Eager loading per evitare query N+1
            $timeSlot->load('workingDay');
            $workingDay = $timeSlot->workingDay;

            // STEP 3: Verifica che max_orders esista
            // Se mancano dati di configurazione, non possiamo procedere
            if ($workingDay->max_orders === null) {
                throw new \Exception('Impossibile creare l\'ordine: dati di configurazione mancanti (max_orders non definito).');
            }

            // STEP 4: Conta gli ordini esistenti su questo slot
            // Solo ordini NON rejected (quelli rejected non occupano posto)
            $existingOrdersCount = Order::where('time_slot_id', $timeSlotId)
                ->where('status', '!=', 'rejected')
                ->count();

            // STEP 5: Verifica capienza
            if ($existingOrdersCount >= $workingDay->max_orders) {
                throw new SlotFullError();
            }

            // STEP 6: Crea l'ordine in stato "pending"
            $order = new Order([
                'user_id' => $user->id,
                'time_slot_id' => $timeSlotId,
            ]);
            $order->status = 'pending'; // Stato iniziale fisso
            $order->save();

            // STEP 7: Salva snapshot degli ingredienti
            // Carica tutti gli ingredienti in una query per efficienza
            $ingredients = Ingredient::whereIn('id', $ingredientIds)->get();

            $snapshots = [];
            foreach ($ingredients as $ingredient) {
                $snapshots[] = [
                    'order_id' => $order->id,
                    'name' => $ingredient->name,
                    'category' => $ingredient->category,
                ];
            }

            // Insert bulk per performance
            $order->ingredients()->createMany($snapshots);

            // STEP 8: Ritorna l'ordine con gli ingredienti caricati
            return $order->load('ingredients');
        });
    }

    /**
     * Aggiorna un ordine esistente.
     * 
     * REGOLE:
     * - Solo l'utente proprietario può aggiornare
     * - Solo ordini in stato "pending" sono modificabili
     * - Non è possibile cambiare time_slot (deve cancellare e ricreare)
     * - Gli ingredienti vengono completamente sostituiti
     * 
     * @param Order $order L'ordine da aggiornare
     * @param User $user L'utente che richiede l'aggiornamento
     * @param array $ingredientIds Nuovi ingredienti (sovrascrivono i precedenti)
     * @return Order L'ordine aggiornato
     * @throws UnauthorizedOrderAccessError Se l'utente non è il proprietario
     * @throws OrderNotModifiableError Se l'ordine non è in stato pending
     */
    public function updateOrder(Order $order, User $user, array $ingredientIds): Order
    {
        return DB::transaction(function () use ($order, $user, $ingredientIds) {
            
            // VERIFICA 1: L'utente è il proprietario?
            if ($order->user_id !== $user->id) {
                throw new UnauthorizedOrderAccessError();
            }

            // VERIFICA 2: L'ordine è in stato pending?
            if (!$order->isPending()) {
                throw new OrderNotModifiableError();
            }

            // STEP 1: Elimina gli ingredienti esistenti
            $order->ingredients()->delete();

            // STEP 2: Salva i nuovi ingredienti come snapshot
            $ingredients = Ingredient::whereIn('id', $ingredientIds)->get();

            $snapshots = [];
            foreach ($ingredients as $ingredient) {
                $snapshots[] = [
                    'order_id' => $order->id,
                    'name' => $ingredient->name,
                    'category' => $ingredient->category,
                ];
            }

            $order->ingredients()->createMany($snapshots);

            // STEP 3: Aggiorna il timestamp updated_at
            $order->touch();

            return $order->load('ingredients');
        });
    }

    /**
     * Elimina un ordine.
     * 
     * REGOLE:
     * - Solo l'utente proprietario può eliminare
     * - Solo ordini in stato "pending" possono essere eliminati
     * - Eliminazione definitiva (NO soft delete)
     * - Gli snapshot ingredienti vengono eliminati automaticamente (cascade)
     * 
     * @param Order $order L'ordine da eliminare
     * @param User $user L'utente che richiede l'eliminazione
     * @return void
     * @throws UnauthorizedOrderAccessError Se l'utente non è il proprietario
     * @throws OrderNotModifiableError Se l'ordine non è in stato pending
     */
    public function deleteOrder(Order $order, User $user): void
    {
        // VERIFICA 1: L'utente è il proprietario?
        if ($order->user_id !== $user->id) {
            throw new UnauthorizedOrderAccessError();
        }

        // VERIFICA 2: L'ordine è in stato pending?
        if (!$order->isPending()) {
            throw new OrderNotModifiableError();
        }

        // STEP 1: Elimina l'ordine
        // Gli ingredienti vengono eliminati automaticamente (cascade FK)
        $order->delete();
    }

    /**
     * Cambia lo stato di un ordine (solo admin).
     * 
     * REGOLE DI TRANSIZIONE:
     * - Non si può mai tornare a "pending"
     * - Non si può uscire da "rejected"
     * - Tutte le altre transizioni sono permesse
     * 
     * ESEMPI VALIDI:
     * - pending → confirmed
     * - confirmed → ready
     * - ready → picked_up
     * - picked_up → confirmed (rollback permesso)
     * - confirmed → rejected
     * 
     * ESEMPI INVALIDI:
     * - confirmed → pending (pending è solo iniziale)
     * - rejected → ready (rejected è finale)
     * 
     * @param Order $order L'ordine di cui cambiare lo stato
     * @param string $newStatus Il nuovo stato
     * @return Order L'ordine aggiornato
     * @throws InvalidOrderStateTransitionError Se la transizione non è consentita
     */
    public function changeStatus(Order $order, string $newStatus): Order
    {
        // VERIFICA: La transizione è consentita?
        if (!$order->canTransitionTo($newStatus)) {
            throw new InvalidOrderStateTransitionError($order->status, $newStatus);
        }

        // STEP 1: Aggiorna lo stato
        $order->status = $newStatus;
        $order->save();

        return $order;
    }
}
