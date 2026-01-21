<?php

namespace App\Http\Controllers;

use App\Services\HomeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Controller pubblico per la home page
class HomeController extends Controller
{
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

    private function getTodayWorkingDay(): ?array
    {
        // Placeholder until WorkingDay query implemented
        return [
            'location' => 'North Quad Station',
            'start_time' => '11:00 AM',
            'end_time' => '4:00 PM',
            'is_live' => true, // TODO: Calcolare se attualmente aperto
        ];
    }

    private function getFutureWorkingDays(): array
    {
        // Placeholder until WorkingDay query implemented
        return [];
    }

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

    private function getWeekDaysData(?array $todayWorkingDay, array $futureWorkingDays): array
    {
        // Delegate to shared SchedulerService so server-render and API use same logic
        return app(\App\Services\SchedulerService::class)->buildWeekScheduler();
    }

    public function apiIndex()
    {
        $homeService = app(HomeService::class);
        $payload = $homeService->buildHomePayload();

        return response()->json($payload);
    }

    public function getTimeSlots(Request $request)
    {
        // valida parametro date
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $dateString = $validated['date'];
        $date = \Carbon\Carbon::parse($dateString);

        // Se la data è nel passato (esclusa la stessa giornata), restituisci slots vuoti
        // Nota: Carbon::parse('YYYY-MM-DD') imposta mezzanotte, che rende isPast() true
        // per la giornata corrente se usiamo isPast() da solo. Escludiamo isToday().
        if ($date->isPast() && !$date->isToday()) {
            return response()->json([
                'dateLabel' => $date->format('l, F j'),
                'locationLabel' => config('ui.location_label', 'Engineering Hub'),
                'slots' => [],
            ]);
        }

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

