<?php

namespace App\Http\Controllers;

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
}

