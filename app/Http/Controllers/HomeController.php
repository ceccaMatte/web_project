<?php

namespace App\Http\Controllers;

use App\Services\HomeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * HomeController
 * 
 * RESPONSABILITÀ:
 * - Serve la home page pubblica
 * - Passa stato user alla view
 * - Passa dati working days/slots disponibili
 * 
 * COSA NON FA:
 * - NON applica middleware auth (home è pubblica)
 * - NON gestisce logica di business (delegata ai services)
 */
class HomeController extends Controller
{
    /**
     * Mostra la home page.
     * 
     * LOGICA:
     * 1. Determina stato user (guest, autenticato, disabilitato)
     * 2. Recupera working day corrente (se disponibile)
     * 3. Recupera giorni futuri con slot
     * 4. Passa tutto alla view
     * 
     * @return \Illuminate\View\View
     */
    public function index()
    {
        // 1. Determina stato user
        $user = $this->getUserState();

        // 2. Recupera working day corrente (se esiste e disponibile oggi)
        // TODO: Implementare logica con WorkingDay model
        $todayWorkingDay = $this->getTodayWorkingDay();

        // 3. Recupera working days futuri
        // TODO: Implementare logica con WorkingDay model
        $futureWorkingDays = $this->getFutureWorkingDays();

        // 4. Prepara dati per truck-status-card
        $todayServiceData = $this->getTodayServiceData($todayWorkingDay);

        // 5. Prepara dati per week-scheduler
        $weekDaysData = $this->getWeekDaysData($todayWorkingDay, $futureWorkingDays);

        return view('pages.home', [
            'user' => $user,
            'todayWorkingDay' => $todayWorkingDay,
            'futureWorkingDays' => $futureWorkingDays,
            'todayServiceData' => $todayServiceData,
            'weekDaysData' => $weekDaysData,
        ]);
    }

    /**
     * Determina stato utente.
     * 
     * STATI:
     * - Guest: { authenticated: false, enabled: false, name: null }
     * - User autenticato attivo: { authenticated: true, enabled: true, name: '...' }
     * - User autenticato disabilitato: { authenticated: true, enabled: false, name: '...' }
     * 
     * @return array
     */
    private function getUserState(): array
    {
        if (!Auth::check()) {
            // Guest
            return [
                'authenticated' => false,
                'enabled' => false,
                'name' => null,
            ];
        }

        $user = Auth::user();

        return [
            'authenticated' => true,
            'enabled' => $user->enabled ?? true, // TODO: Verificare campo enabled su User model
            'name' => $user->name,
        ];
    }

    /**
     * Recupera working day corrente (se disponibile oggi).
     * 
     * TODO: Implementare query reale
     * 
     * @return array|null
     */
    private function getTodayWorkingDay(): ?array
    {
        // TODO: Query WorkingDay per today
        // $workingDay = WorkingDay::whereDate('day', today())->first();

        // Placeholder
        return [
            'location' => 'North Quad Station',
            'start_time' => '11:00 AM',
            'end_time' => '4:00 PM',
            'is_live' => true, // TODO: Calcolare se attualmente aperto
        ];
    }

    /**
     * Recupera working days futuri con slot disponibili.
     * 
     * TODO: Implementare query reale
     * 
     * @return array
     */
    private function getFutureWorkingDays(): array
    {
        // TODO: Query WorkingDay futuri + TimeSlots
        // $days = WorkingDay::where('day', '>', today())->with('timeSlots')->get();

        // Placeholder
        return [];
    }

    /**
     * Prepara dati per truck-status-card basati su todayWorkingDay.
     * 
     * LOGICA:
     * - Se todayWorkingDay esiste → status = 'active' con tutti i dati
     * - Altrimenti → status = 'inactive'
     * 
     * NOTA: NON calcola stati temporali, solo trasforma i dati.
     * 
     * @param array|null $todayWorkingDay
     * @return array
     */
    private function getTodayServiceData(?array $todayWorkingDay): array
    {
        if ($todayWorkingDay) {
            return [
                'status' => 'active',
                'location' => $todayWorkingDay['location'],
                'startTime' => $todayWorkingDay['start_time'],
                'endTime' => $todayWorkingDay['end_time'],
                'queueTime' => 15, // TODO: Calcolare da dati reali
            ];
        }

        return [
            'status' => 'inactive',
            'location' => null,
            'startTime' => null,
            'endTime' => null,
            'queueTime' => null,
        ];
    }

    /**
     * Prepara dati per week-scheduler (7 giorni).
     * 
     * LOGICA:
     * - Parte da oggi (today)
     * - Genera 7 giorni consecutivi
     * - Per ogni giorno calcola: isToday, isActive, isDisabled, isSelected
     * 
     * STATI:
     * - isToday: giorno === oggi
     * - isActive: giorno presente/futuro E servizio disponibile
     * - isDisabled: passato O futuro senza servizio
     * - isSelected: today di default (anche se disabled)
     * 
     * @param array|null $todayWorkingDay
     * @param array $futureWorkingDays
     * @return array
     */
    private function getWeekDaysData(?array $todayWorkingDay, array $futureWorkingDays): array
    {
        $today = today();
        $days = [];
        
        // Simula giorni attivi (TODO: usare $futureWorkingDays reali)
        // Per ora: lun-ven attivi, weekend no
        $activeDays = [
            $today->copy()->format('Y-m-d'), // Oggi
            $today->copy()->addDays(1)->format('Y-m-d'),
            $today->copy()->addDays(2)->format('Y-m-d'),
            $today->copy()->addDays(4)->format('Y-m-d'), // Salta weekend
        ];

        for ($i = 0; $i < 7; $i++) {
            $date = $today->copy()->addDays($i);
            $dateString = $date->format('Y-m-d');
            $isToday = $i === 0;
            $isPast = $date->isPast() && !$isToday;
            $isActive = in_array($dateString, $activeDays) && !$isPast;
            $isDisabled = $isPast || !$isActive;

            $days[] = [
                'id' => $dateString,
                'weekday' => strtoupper($date->format('D')),
                'dayNumber' => $date->format('d'),
                'isToday' => $isToday,
                'isActive' => $isActive,
                'isDisabled' => $isDisabled,
                'isSelected' => $isToday, // Default: today è selezionato
            ];
        }

        return [
            'monthLabel' => $today->format('F Y'),
            'days' => $days,
            'selectedDayId' => $today->format('Y-m-d'), // Default selection
        ];
    }

    /**
     * API endpoint per la Home page.
     *
     * ARCHITETTURA:
     * - Endpoint read-only, idempotente
     * - Non richiede autenticazione (usa sessione)
     * - Restituisce contratto stabile per frontend
     * - Orchestrazione: chiama HomeService per costruire response
     *
     * PERCHÉ API SEPARATA:
     * - Frontend può fare polling per aggiornamenti real-time
     * - Separazione chiara tra view rendering e data API
     * - Possibilità di caching a livello API
     * - Frontend può essere SPA o server-rendered indifferentemente
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function apiIndex()
    {
        $homeService = new HomeService();
        $payload = $homeService->buildHomePayload();

        return response()->json($payload);
    }

    /**
     * API endpoint per time slots di un giorno specifico.
     * 
     * WORKFLOW:
     * 1. Valida parametro ?date=YYYY-MM-DD
     * 2. Recupera time slots per quel giorno
     * 3. Formatta risposta con dateLabel, locationLabel, slots
     * 
     * RESPONSE: {
     *   dateLabel: "Friday, January 17",
     *   locationLabel: "Engineering Hub",
     *   slots: [
     *     {
     *       id: 13,
     *       timeLabel: "11:00",
     *       slotsLeft: 45,
     *       href: "/orders/create?slot=13",
     *       isDisabled: false
     *     },
     *     ...
     *   ]
     * }
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTimeSlots(Request $request)
    {
        // 1. Valida parametro date
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $dateString = $validated['date'];
        $date = \Carbon\Carbon::parse($dateString);

        // 2. Recupera working day per quella data con time slots
        $workingDay = \App\Models\WorkingDay::where('day', $dateString)
            ->with(['timeSlots' => function ($query) {
                $query->orderBy('start_time', 'asc');
            }])
            ->first();

        // 3. Se non esiste working day, restituisci slots vuoti
        if (!$workingDay) {
            return response()->json([
                'dateLabel' => $date->format('l, F j'), // "Friday, January 17"
                'locationLabel' => config('ui.location_label', 'Engineering Hub'),
                'slots' => [],
            ]);
        }

        // 4. Formatta time slots con capacità dinamica
        $timeSlots = $workingDay->timeSlots->map(function ($slot) use ($workingDay) {
            // Conta ordini confermati per questo slot
            $ordersCount = \App\Models\Order::where('time_slot_id', $slot->id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->count();

            $slotsLeft = $workingDay->max_orders - $ordersCount;
            $isDisabled = $slotsLeft <= 0;

            return [
                'id' => $slot->id,
                'timeLabel' => substr($slot->start_time, 0, 5), // "11:00:00" -> "11:00"
                'slotsLeft' => max(0, $slotsLeft), // Non negativo
                'href' => "/orders/create?slot={$slot->id}",
                'isDisabled' => $isDisabled,
            ];
        });

        return response()->json([
            'dateLabel' => $date->format('l, F j'),
            'locationLabel' => $workingDay->location ?? config('ui.location_label', 'Engineering Hub'),
            'slots' => $timeSlots,
        ]);
    }

    /**
     * API endpoint per polling automatico every 5 secondi.
     * 
     * RESPONSABILITÀ:
     * - Aggiorna dati truck card (SEMPRE today)
     * - Aggiorna ordini utente (SOLO today)
     * - Aggiorna time slots (del giorno selezionato)
     * 
     * CARATTERISTICHE:
     * - Endpoint leggero e veloce
     * - Ottimizzato per chiamate frequenti
     * - Idempotente
     * 
     * RESPONSE: {
     *   today: {
     *     is_active: boolean,
     *     location: string,
     *     start_time: string,
     *     end_time: string
     *   },
     *   user_orders_today: [
     *     { id: number, status: string }
     *   ],
     *   selected_day_slots: [
     *     { time: string, available: number, id: number, href: string }
     *   ]
     * }
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function polling(Request $request)
    {
        // 1. Valida parametro date per i time slots
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $selectedDate = $validated['date'];
        $today = today()->format('Y-m-d');

        // 2. Dati TODAY per truck card (SEMPRE today, mai selectedDate)
        $todayWorkingDay = \App\Models\WorkingDay::where('day', $today)->first();
        $todayData = [
            'is_active' => (bool) $todayWorkingDay,
            'location' => $todayWorkingDay->location ?? null,
            'start_time' => $todayWorkingDay ? substr($todayWorkingDay->start_time, 0, 5) : null,
            'end_time' => $todayWorkingDay ? substr($todayWorkingDay->end_time, 0, 5) : null,
        ];

        // 3. Ordini utente per TODAY (SOLO today, mai selectedDate)
        $userOrdersToday = [];
        if (auth()->check()) {
            $userOrdersToday = \App\Models\Order::where('user_id', auth()->id())
                ->whereHas('timeSlot.workingDay', function ($query) use ($today) {
                    $query->where('day', $today);
                })
                ->get(['id', 'status'])
                ->toArray();
        }

        // 4. Time slots per selectedDate (può essere diverso da today)
        $selectedDaySlots = [];
        $workingDay = \App\Models\WorkingDay::where('day', $selectedDate)
            ->with(['timeSlots' => function ($query) {
                $query->orderBy('start_time', 'asc');
            }])
            ->first();

        if ($workingDay) {
            $selectedDaySlots = $workingDay->timeSlots->map(function ($slot) use ($workingDay) {
                $ordersCount = \App\Models\Order::where('time_slot_id', $slot->id)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->count();

                $available = max(0, $workingDay->max_orders - $ordersCount);

                return [
                    'id' => $slot->id,
                    'time' => substr($slot->start_time, 0, 5),
                    'available' => $available,
                    'href' => "/orders/create?slot={$slot->id}",
                ];
            });
        }

        return response()->json([
            'today' => $todayData,
            'user_orders_today' => $userOrdersToday,
            'selected_day_slots' => $selectedDaySlots,
        ]);
    }
}

