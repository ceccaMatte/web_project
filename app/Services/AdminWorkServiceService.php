<?php

namespace App\Services;

use App\Models\Order;
use App\Models\TimeSlot;
use App\Models\WorkingDay;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * AdminWorkServiceService
 * 
 * Servizio dedicato alla pagina Admin Work Service.
 * Fornisce i dati necessari per la gestione operativa degli ordini.
 * 
 * RESPONSABILITÀ:
 * - Fetch dati giornata (time slots + ordini)
 * - Aggregazione conteggi per stato
 * - Formattazione ingredienti con sigle
 * 
 * NON GESTISCE:
 * - Selezioni UI (frontend only)
 * - Polling logic (controller)
 * - Validazioni di stato (OrderService)
 */
class AdminWorkServiceService
{
    /**
     * Stati ordine visibili nella pipeline di lavoro.
     * pending NON è incluso (va solo nei conteggi time slot).
     */
    private const PIPELINE_STATES = ['confirmed', 'ready', 'picked_up'];

    /**
     * Tutti gli stati ordine (per conteggi).
     */
    private const ALL_STATES = ['pending', 'confirmed', 'ready', 'picked_up'];

    /**
     * Categorie ingredienti nell'ordine corretto.
     */
    private const INGREDIENT_CATEGORIES = ['bread', 'meat', 'cheese', 'vegetable', 'sauce', 'other'];

    /**
     * Recupera tutti i dati per una giornata lavorativa.
     * 
     * Usato sia per fetch iniziale che per polling.
     * La struttura è IDENTICA in entrambi i casi.
     * 
     * @param string $date Data in formato YYYY-MM-DD
     * @return array Dati formattati per il frontend
     */
    public function getWorkServiceData(string $date): array
    {
        $carbonDate = Carbon::parse($date);
        
        // Trova il working day per questa data
        $workingDay = WorkingDay::whereDate('day', $carbonDate->toDateString())->first();
        
        if (!$workingDay) {
            return $this->emptyResponse($date);
        }

        // Carica time slots con ordini eager loaded
        $timeSlots = TimeSlot::where('working_day_id', $workingDay->id)
            ->with(['orders' => function ($query) {
                $query->with(['user', 'ingredients'])
                    ->orderBy('daily_number', 'asc');
            }])
            ->orderBy('start_time', 'asc')
            ->get();

        // Determina il time slot corrente (se esiste)
        $currentTimeSlotId = $this->findCurrentTimeSlotId($timeSlots, $carbonDate);

        return [
            'date' => $date,
            'currentTimeSlotId' => $currentTimeSlotId,
            'timeSlots' => $this->formatTimeSlots($timeSlots),
            'orders' => $this->formatOrders($timeSlots),
        ];
    }

    /**
     * Trova il time slot che contiene l'orario corrente.
     * Restituisce null se l'orario è fuori dalla finestra di servizio.
     * 
     * @param Collection $timeSlots
     * @param Carbon $date
     * @return int|null
     */
    private function findCurrentTimeSlotId(Collection $timeSlots, Carbon $date): ?int
    {
        // Solo se la data è oggi
        if (!$date->isToday()) {
            return null;
        }

        $now = Carbon::now();
        $currentTime = $now->format('H:i:s');

        foreach ($timeSlots as $slot) {
            if ($currentTime >= $slot->start_time && $currentTime < $slot->end_time) {
                return $slot->id;
            }
        }

        return null;
    }

    /**
     * Formatta i time slots per il frontend.
     * Include i conteggi per stato.
     * 
     * @param Collection $timeSlots
     * @return array
     */
    private function formatTimeSlots(Collection $timeSlots): array
    {
        return $timeSlots->map(function ($slot) {
            $orders = $slot->orders;
            
            return [
                'id' => $slot->id,
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
                'counts' => [
                    'pending' => $orders->where('status', 'pending')->count(),
                    'confirmed' => $orders->where('status', 'confirmed')->count(),
                    'ready' => $orders->where('status', 'ready')->count(),
                    'picked_up' => $orders->where('status', 'picked_up')->count(),
                ],
            ];
        })->values()->toArray();
    }

    /**
     * Formatta tutti gli ordini (esclusi rejected) per il frontend.
     * Ordini ordinati per daily_number ASC.
     * 
     * @param Collection $timeSlots
     * @return array
     */
    private function formatOrders(Collection $timeSlots): array
    {
        $allOrders = collect();

        foreach ($timeSlots as $slot) {
            foreach ($slot->orders as $order) {
                // Escludi ordini rejected dalla pipeline
                if ($order->status === 'rejected') {
                    continue;
                }

                $allOrders->push($this->formatOrder($order, $slot->id));
            }
        }

        // Ordina per daily_number ASC
        return $allOrders->sortBy('daily_number')->values()->toArray();
    }

    /**
     * Formatta un singolo ordine per il frontend.
     * 
     * @param Order $order
     * @param int $timeSlotId
     * @return array
     */
    private function formatOrder(Order $order, int $timeSlotId): array
    {
        return [
            'id' => $order->id,
            'daily_number' => $order->daily_number,
            'status' => $order->status,
            'time_slot_id' => $timeSlotId,
            'time_slot' => [
                'start_time' => $order->timeSlot->start_time ?? null,
                'end_time' => $order->timeSlot->end_time ?? null,
            ],
            'user' => [
                'id' => $order->user->id,
                'nickname' => $order->user->nickname ?? $order->user->name,
            ],
            'ingredients' => $this->formatIngredients($order->ingredients),
        ];
    }

    /**
     * Formatta gli ingredienti raggruppati per categoria.
     * Usa il campo 'code' se disponibile, altrimenti 'name'.
     * 
     * NOTA: OrderIngredient sono snapshot con name/category.
     * Il 'code' potrebbe non essere presente nelle vecchie versioni.
     * 
     * @param Collection $ingredients
     * @return array
     */
    private function formatIngredients(Collection $ingredients): array
    {
        $result = [];

        foreach (self::INGREDIENT_CATEGORIES as $category) {
            $categoryIngredients = $ingredients
                ->where('category', $category)
                ->map(function ($ing) {
                    return [
                        'name' => $ing->name,
                        'code' => $ing->code ?? $this->generateCode($ing->name),
                    ];
                })
                ->values()
                ->toArray();

            if (!empty($categoryIngredients)) {
                $result[$category] = $categoryIngredients;
            }
        }

        return $result;
    }

    /**
     * Genera un codice abbreviato dal nome dell'ingrediente.
     * Usato come fallback se 'code' non è disponibile.
     * 
     * @param string $name
     * @return string
     */
    private function generateCode(string $name): string
    {
        // Prendi le prime 3 lettere in maiuscolo
        $words = explode(' ', trim($name));
        if (count($words) >= 2) {
            // Se più parole, prendi iniziale di ogni parola
            return strtoupper(
                substr($words[0], 0, 1) . 
                substr($words[1], 0, 1) . 
                (isset($words[2]) ? substr($words[2], 0, 1) : '')
            );
        }
        return strtoupper(substr($name, 0, 3));
    }

    /**
     * Risposta vuota per giorni senza dati.
     * 
     * @param string $date
     * @return array
     */
    private function emptyResponse(string $date): array
    {
        return [
            'date' => $date,
            'currentTimeSlotId' => null,
            'timeSlots' => [],
            'orders' => [],
        ];
    }

    /**
     * Cambia lo stato di un ordine.
     * Delega la logica di transizione all'OrderService.
     * 
     * @param Order $order
     * @param string $newStatus
     * @return Order
     */
    public function changeOrderStatus(Order $order, string $newStatus): Order
    {
        // Validazione stati ammessi
        $allowedStates = ['pending', 'confirmed', 'ready', 'picked_up', 'rejected'];
        
        if (!in_array($newStatus, $allowedStates)) {
            throw new \InvalidArgumentException("Invalid status: {$newStatus}");
        }

        $order->status = $newStatus;
        $order->save();

        return $order->fresh(['user', 'ingredients']);
    }
}
