<?php

namespace App\Services;

use App\Models\FavoriteSandwich;
use App\Models\Order;
use App\Models\WorkingDay;
use Illuminate\Support\Facades\Auth;

/**
 * Service per la costruzione delle API della pagina Orders.
 *
 * ARCHITETTURA:
 * - OrderController: orchestration (riceve request, chiama service, restituisce JSON)
 * - OrdersPageService: costruzione della response (logica di aggregazione dati)
 *
 * PERCHÉ QUESTA ARCHITETTURA:
 * - Separazione responsabilità: controller HTTP, service business logic
 * - Testabilità: posso testare il service senza HTTP
 * - Riutilizzabilità: service usabile da altri endpoint o CLI
 */
class OrdersPageService
{
    /**
     * Costruisce il payload completo per l'inizializzazione della pagina Orders.
     *
     * @param string $date Data nel formato YYYY-MM-DD per filtrare gli ordini attivi
     * @return array Il payload JSON per la pagina Orders
     */
    public function buildOrdersPagePayload(string $date = null): array
    {
        $date = $date ?? now()->toDateString();
        
        return [
            'user' => $this->buildUserSection(),
            'scheduler' => $this->buildSchedulerSection(),
            'activeOrders' => $this->getActiveOrdersForDate($date),
            'recentOrders' => $this->getRecentOrders(),
        ];
    }

    /**
     * Costruisce la sezione "user" della response.
     *
     * @return array
     */
    private function buildUserSection(): array
    {
        $user = Auth::user();

        return [
            'authenticated' => Auth::check(),
            'enabled' => $user ? $user->enabled : false,
            'name' => $user ? $user->name : null,
        ];
    }

    /**
     * Costruisce la sezione "scheduler" della response.
     * 
     * IDENTICA a HomeService per consistenza UI.
     *
     * @return array
     */
    private function buildSchedulerSection(): array
    {
        // Delegate allo SchedulerService (shared logic)
        $scheduler = app(SchedulerService::class)->buildWeekScheduler();
        return $scheduler;
    }

    /**
     * Recupera gli ordini attivi dell'utente per una data specifica.
     *
     * Ordini attivi = ordini NON in stato "picked_up" o "rejected"
     *
     * @param string $date Data in formato YYYY-MM-DD
     * @return array
     */
    public function getActiveOrdersForDate(string $date): array
    {
        $user = Auth::user();
        if (!$user) {
            return [];
        }

        // Trova il working_day per la data
        $workingDay = WorkingDay::whereDate('day', $date)->first();
        if (!$workingDay) {
            return [];
        }

        // Recupera ordini attivi dell'utente per questo working_day
        $orders = Order::where('user_id', $user->id)
            ->where('working_day_id', $workingDay->id)
            ->whereNotIn('status', ['picked_up'])
            ->with(['timeSlot', 'ingredients'])
            ->orderBy('created_at', 'desc')
            ->get();

        return $orders->map(function ($order) {
            return $this->formatOrderForApi($order);
        })->toArray();
    }

    /**
     * Recupera gli ordini recenti dell'utente (storico).
     *
     * Ordini recenti = ordini già completati (picked_up) o di giorni passati.
     * Limitato a 20 ordini per performance.
     *
     * @return array
     */
    public function getRecentOrders(): array
    {
        $user = Auth::user();
        if (!$user) {
            return [];
        }

        // Ordini completati o di giorni passati
        $orders = Order::where('user_id', $user->id)
            ->where(function ($query) {
                // Ordini picked_up
                $query->where('status', 'picked_up')
                    // Oppure ordini di giorni passati (qualsiasi stato tranne rejected)
                    ->orWhereHas('workingDay', function ($q) {
                        $q->where('day', '<', now()->toDateString());
                    });
            })
            ->where('status', '!=', 'rejected')
            ->with(['timeSlot', 'ingredients', 'workingDay'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return $orders->map(function ($order) {
            return $this->formatOrderForApi($order);
        })->toArray();
    }

    /**
     * Formatta un ordine per l'API.
     *
     * Struttura output conforme al contratto definito:
     * {
     *   id, status, date, time_slot, is_modifiable,
     *   ingredients, ingredient_configuration_id, is_favorite
     * }
     *
     * @param Order $order
     * @return array
     */
    private function formatOrderForApi(Order $order): array
    {
        // Calcola is_modifiable: solo se pending
        $isModifiable = $order->status === 'pending';

        // Formatta ingredienti
        $ingredients = $order->ingredients->map(function ($ingredient) {
            return [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
            ];
        })->toArray();

        // Data dell'ordine (dal working_day)
        $date = null;
        if ($order->workingDay) {
            $date = $order->workingDay->day->format('Y-m-d');
        } elseif ($order->timeSlot && $order->timeSlot->workingDay) {
            $date = $order->timeSlot->workingDay->day->format('Y-m-d');
        }

        // Time slot label
        $timeSlot = null;
        if ($order->timeSlot) {
            // start_time è già una stringa nel formato HH:MM
            $timeSlot = $order->timeSlot->start_time;
        }

        // Calcola ingredient_configuration_id dalla combinazione di nomi ingredienti
        $ingredientNames = $order->ingredients->pluck('name')->toArray();
        $ingredientConfigId = FavoriteSandwich::generateConfigurationId($ingredientNames);

        // Verifica se questa configurazione è nei preferiti dell'utente
        $userId = Auth::id();
        $isFavorite = $userId ? FavoriteSandwich::isFavorite($userId, $ingredientConfigId) : false;

        return [
            'id' => $order->id,
            'status' => $order->status,
            'date' => $date,
            'time_slot' => $timeSlot,
            'is_modifiable' => $isModifiable,
            'ingredients' => $ingredients,
            'ingredient_configuration_id' => $ingredientConfigId,
            'is_favorite' => $isFavorite,
            'order_number' => $order->daily_number,
            'image_url' => null, // TODO: generare URL immagine
        ];
    }
}
