<?php

namespace App\Services;

use App\Models\Order;
use App\Models\TimeSlot;
use App\Models\WorkingDay;
use App\Services\SchedulerService;
use App\Services\OrderFormService;
use Illuminate\Support\Facades\Auth;

/**
 * Service per la costruzione della Home API response.
 *
 * ARCHITETTURA:
 * - HomeController: orchestration (riceve request, chiama service, restituisce JSON)
 * - HomeService: costruzione della response (logica di aggregazione dati)
 * - Metodi privati: sezioni specifiche della response
 *
 * PERCHÉ QUESTA ARCHITETTURA:
 * - Separazione responsabilità: controller HTTP, service business logic
 * - Testabilità: posso testare il service senza HTTP
 * - Riutilizzabilità: service usabile da altri endpoint o CLI
 * - Manutenibilità: logica aggregazione isolata e commentata
 *
 * STRUTTURA RESPONSE:
 * La response è un contratto stabile tra backend e frontend.
 * Ogni sezione è costruita da un metodo dedicato per chiarezza.
 */
class HomeService
{
    // Queue time weighting constants (minutes per order)
    private const TIME_PREV_ORDER_CONFIRMED = 2; // minutes per confirmed order in previous slots
    private const TIME_PREV_ORDER_READY = 0.5;     // minutes per ready order in previous slots
    private const TIME_NOW_ORDER_CONFIRMED = 3;  // minutes per confirmed order in current slot
    private const TIME_NOW_ORDER_READY = 0.5;      // minutes per ready order in current slot

    /**
     * Costruisce il payload completo per la Home API.
     *
     * Questo è il metodo principale chiamato dal controller.
     * Orchesta la costruzione di tutte le sezioni della response.
     *
     * @return array Il payload JSON per la Home
     */
    public function buildHomePayload(): array
    {
        $scheduler = $this->buildSchedulerSection();

        // Include initial time slots for the selected day to avoid an extra fetch
        $selectedDay = $scheduler['selectedDayId'] ?? null;
        $initialTimeSlots = [];
        if ($selectedDay) {
            // Use OrderFormService to get slots for the date (reuse existing logic)
            $initialTimeSlots = app(OrderFormService::class)->getTimeSlotsForDate($selectedDay);
        }

        return [
            'user' => $this->buildUserSection(),
            'todayService' => $this->buildTodayServiceSection(),
            'scheduler' => $scheduler,
            'ordersPreview' => $this->buildOrdersPreviewSection(),
            'booking' => $this->buildBookingSection(),
            'initialTimeSlots' => $initialTimeSlots,
        ];
    }

    /**
     * Costruisce la sezione "user" della response.
     *
     * LOGICA:
     * - Usa Auth::check() per determinare se autenticato
     * - Se autenticato, carica user con relazioni necessarie
     * - Restituisce dati essenziali per il frontend
     *
     * @return array
     */
    private function buildUserSection(): array
    {
        
        $user = Auth::user();
        
        $result = [
            'authenticated' => Auth::check(),
            'enabled' => $user ? $user->enabled : false,
            'name' => $user ? $user->name : null,
        ];
        
        return $result;
    }

    /**
     * Costruisce la sezione "todayService" della response.
     *
     * LOGICA:
     * - Trova il working_day di oggi (se esiste)
     * - Determina se il servizio è attivo oggi
     * - Calcola queue_time basato sugli ordini attivi
     *
     * @return array
     */
    private function buildTodayServiceSection(): array
    {
        // Cerchiamo il working_day di oggi
        $today = now()->toDateString();
        $workingDay = WorkingDay::whereDate('day', $today)->first();

        if (!$workingDay) {
            // Nessun servizio oggi
            return [
                'status' => 'inactive',
                'location' => null,
                'startTime' => null,
                'endTime' => null,
                'queueTime' => null,
            ];
        }

        // Servizio attivo: calcoliamo queue_time usando la nuova formula
        // Formula: prev_confirmed * TIME_PREV_ORDER_CONFIRMED
        //        + prev_ready * TIME_PREV_ORDER_READY
        //        + now_confirmed * TIME_NOW_ORDER_CONFIRMED
        //        + now_ready * TIME_NOW_ORDER_READY

        $nowTime = now()->format('H:i:s');

        // Trova lo slot corrente (start_time <= now < end_time)
        $currentSlot = TimeSlot::where('working_day_id', $workingDay->id)
            ->where('start_time', '<=', $nowTime)
            ->where('end_time', '>', $nowTime)
            ->first();

        if ($currentSlot) {
            $currentStart = $currentSlot->start_time;
            $prevSlotIds = TimeSlot::where('working_day_id', $workingDay->id)
                ->where('start_time', '<', $currentStart)
                ->pluck('id')
                ->toArray();
            $currentSlotId = $currentSlot->id;
        } else {
            // Fallback: consideriamo tutti gli slot con start_time < now come "precedenti"
            $prevSlotIds = TimeSlot::where('working_day_id', $workingDay->id)
                ->where('start_time', '<', $nowTime)
                ->pluck('id')
                ->toArray();
            $currentSlotId = null;
        }

        $prevConfirmed = 0;
        $prevReady = 0;
        $nowConfirmed = 0;
        $nowReady = 0;

        if (!empty($prevSlotIds)) {
            $prevConfirmed = Order::whereIn('time_slot_id', $prevSlotIds)
                ->where('status', 'confirmed')
                ->count();

            $prevReady = Order::whereIn('time_slot_id', $prevSlotIds)
                ->where('status', 'ready')
                ->count();
        }

        if ($currentSlotId) {
            $nowConfirmed = Order::where('time_slot_id', $currentSlotId)
                ->where('status', 'confirmed')
                ->count();

            $nowReady = Order::where('time_slot_id', $currentSlotId)
                ->where('status', 'ready')
                ->count();
        }

        $queueTime = (
            $prevConfirmed * self::TIME_PREV_ORDER_CONFIRMED
            + $prevReady * self::TIME_PREV_ORDER_READY
            + $nowConfirmed * self::TIME_NOW_ORDER_CONFIRMED
            + $nowReady * self::TIME_NOW_ORDER_READY
        );

        return [
            'status' => 'active',
            'location' => $workingDay->location,
            'startTime' => config('services.truck.default_start_time', '11:00'),
            'endTime' => config('services.truck.default_end_time', '14:00'),
            'queueTime' => (int) $queueTime,
        ];
    }

    /**
     * Costruisce la sezione "scheduler" della response.
     *
     * LOGICA:
     * - Mostra sempre la settimana corrente (lun-dom)
     * - Determina selectedDayId = oggi
     * - Per ogni giorno: calcola stati (today, active, disabled)
     * - Giorni attivi: hanno working_day con is_active=true
     *
     * @return array
     */
    private SchedulerService $schedulerService;

    public function __construct(SchedulerService $schedulerService)
    {
        $this->schedulerService = $schedulerService;
    }

    private function buildSchedulerSection(): array
    {
        return $this->schedulerService->buildWeekScheduler();
    }

    /**
     * Costruisce la sezione "ordersPreview" della response.
     *
     * LOGICA VARIANTE:
     * - guest: 'login-cta'
     * - user con 0 ordini: 'empty'
     * - user con 1 ordine: 'single'
     * - user con 2+ ordini: 'multi' (mostra il più rilevante)
     *
     * PRIORITÀ ORDINI:
     * 1. rejected
     * 2. ready
     * 3. confirmed
     * 4. pending
     * 5. picked_up
     *
     * @return array
     */
    private function buildOrdersPreviewSection(): array
    {
        $user = Auth::user();

        // Caso guest
        if (!$user) {
            return [
                'variant' => 'login-cta',
                'ordersCount' => 0,
                'selectedOrder' => null,
            ];
        }

  

        // Carichiamo gli ordini dell'utente di oggi
        $today = now()->toDateString();
        $orders = Order::where('user_id', $user->id)
            ->whereHas('workingDay', function ($query) use ($today) {
                $query->whereDate('day', $today);
            })
            ->with(['workingDay', 'timeSlot'])
            ->get();

        $ordersCount = $orders->count();


        // Caso nessun ordine
        if ($ordersCount === 0) {
            return [
                'variant' => 'empty',
                'ordersCount' => 0,
                'selectedOrder' => null,
            ];
        }

        // Caso singolo ordine
        if ($ordersCount === 1) {
            $order = $orders->first();
            return [
                'variant' => 'single',
                'ordersCount' => 1,
                'selectedOrder' => $this->formatOrderForPreview($order),
            ];
        }

        // Caso multi ordini: seleziona il più rilevante
        $selectedOrder = $this->selectMostRelevantOrder($orders);

        return [
            'variant' => 'multi',
            'ordersCount' => $ordersCount,
            'selectedOrder' => $this->formatOrderForPreview($selectedOrder),
        ];
    }

    /**
     * Costruisce la sezione "booking" della response.
     *
     * LOGICA:
     * - Slot di domani (se esiste working_day attivo)
     * - Per ogni slot: calcola slotsLeft, href, isDisabled
     * - href: per guest -> /login, per user -> /orders/create?slot=X
     *
     * @return array
     */
    private function buildBookingSection(): array
    {
        $tomorrow = now()->addDay()->toDateString();
        $workingDay = WorkingDay::whereDate('day', $tomorrow)
            ->first();

        if (!$workingDay) {
            // Nessun servizio domani
            return [
                'dateLabel' => 'Tomorrow, ' . now()->addDay()->format('F j'),
                'locationLabel' => 'No service scheduled',
                'slots' => [],
            ];
        }

        // Carichiamo gli slot di domani
        $timeSlots = TimeSlot::where('working_day_id', $workingDay->id)
            ->orderBy('start_time')
            ->get();

        $user = Auth::user();
        $slots = [];

        foreach ($timeSlots as $slot) {
            // Contiamo ordini attivi su questo slot
            $activeOrdersCount = Order::where('time_slot_id', $slot->id)
                ->whereNotIn('status', ['rejected'])
                ->count();

            $slotsLeft = max(0, $workingDay->max_orders - $activeOrdersCount);
            $isDisabled = $slotsLeft === 0;

            // Determiniamo href
            if ($isDisabled) {
                $href = null;
            } elseif ($user) {
                $href = "/orders/create?slot={$slot->id}";
            } else {
                $href = '/login';
            }

            $slots[] = [
                'id' => $slot->id,
                'timeLabel' => substr($slot->start_time, 0, 5), // HH:MM senza secondi
                'slotsLeft' => $slotsLeft,
                'href' => $href,
                'isDisabled' => $isDisabled,
            ];
        }

        return [
            'dateLabel' => 'Tomorrow, ' . now()->addDay()->format('F j'),
            'locationLabel' => $workingDay->location,
            'slots' => $slots,
        ];
    }

    /**
     * Seleziona l'ordine più rilevante da una collezione.
     *
     * PRIORITÀ (dal più importante):
     * 1. rejected - Problema da risolvere
     * 2. ready - Pronto per ritiro
     * 3. confirmed - In preparazione
     * 4. pending - In attesa
     * 5. picked_up - Completato
     *
     * @param \Illuminate\Database\Eloquent\Collection $orders
     * @return Order
     */
    private function selectMostRelevantOrder($orders): Order
    {
        $priorityMap = [
            'rejected' => 1,
            'ready' => 2,
            'confirmed' => 3,
            'pending' => 4,
            'picked_up' => 5,
        ];

        return $orders->sortBy(function ($order) use ($priorityMap) {
            return $priorityMap[$order->status] ?? 999;
        })->first();
    }

    /**
     * Formatta un ordine per la sezione ordersPreview.
     *
     * @param Order $order
     * @return array
     */
    private function formatOrderForPreview(Order $order): array
    {
        // Costruiamo statusLabel
        $statusLabels = [
            'pending' => 'PENDING',
            'confirmed' => 'CONFIRMED',
            'ready' => 'READY',
            'picked_up' => 'PICKED UP',
            'rejected' => 'REJECTED',
        ];

        $baseLabel = $statusLabels[$order->status] ?? $order->status;

        // Per ready, aggiungiamo orario se disponibile
        if ($order->status === 'ready' && $order->timeSlot) {
            $baseLabel = "READY AT {$order->timeSlot->start_time}";
        }

        return [
            'id' => $order->id,
            'dailyNumber' => $order->daily_number,
            'status' => $order->status,
            'statusLabel' => $baseLabel,
        ];
    }
}