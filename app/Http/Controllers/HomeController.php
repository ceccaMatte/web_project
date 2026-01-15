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

        return view('pages.home', [
            'user' => $user,
            'todayWorkingDay' => $todayWorkingDay,
            'futureWorkingDays' => $futureWorkingDays,
            'todayServiceData' => $todayServiceData,
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
}
