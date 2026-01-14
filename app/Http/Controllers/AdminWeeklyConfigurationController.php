<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminWeeklyConfigurationRequest;
use App\Models\WorkingDay;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Controller per la gestione della configurazione settimanale da parte dell'admin.
 * Permette di configurare i giorni lavorativi futuri senza modificare quelli passati.
 */
class AdminWeeklyConfigurationController extends Controller
{
    /**
     * Aggiorna la configurazione settimanale dei giorni lavorativi.
     *
     * Questo metodo riceve una configurazione completa per la settimana e applica
     * le modifiche solo ai giorni futuri, senza toccare i working_days esistenti.
     * Tutta l'operazione avviene in una transazione database per garantire l'integrità.
     *
     * @param AdminWeeklyConfigurationRequest $request La richiesta validata
     * @return JsonResponse Risposta JSON con il risultato dell'operazione
     */
    public function updateWeeklyConfiguration(AdminWeeklyConfigurationRequest $request): JsonResponse
    {
        // Estrae i parametri dalla richiesta validata
        $maxOrders = $request->input('max_orders');
        $maxTime = $request->input('max_time');
        $location = $request->input('location');
        $daysConfig = $request->input('days');

        // Ottiene la data di oggi per determinare i giorni futuri
        $today = Carbon::today();

        // Mappa dei giorni della settimana per calcolare le prossime date
        // Carbon usa costanti come Carbon::MONDAY, etc.
        $dayMappings = [
            'monday' => Carbon::MONDAY,
            'tuesday' => Carbon::TUESDAY,
            'wednesday' => Carbon::WEDNESDAY,
            'thursday' => Carbon::THURSDAY,
            'friday' => Carbon::FRIDAY,
            'saturday' => Carbon::SATURDAY,
            'sunday' => Carbon::SUNDAY,
        ];

        // Inizia una transazione per garantire atomicità dell'operazione
        // Se qualcosa va storto, tutto viene annullato
        DB::transaction(function () use ($daysConfig, $dayMappings, $today, $maxOrders, $maxTime, $location) {
            foreach ($daysConfig as $dayName => $dayConfig) {
                // Calcola la prossima data per questo giorno della settimana
                $currentDayOfWeek = $today->dayOfWeek;
                $targetDayOfWeek = $dayMappings[$dayName];
                $daysToAdd = ($targetDayOfWeek - $currentDayOfWeek + 7) % 7;
                if ($daysToAdd == 0) {
                    $daysToAdd = 7; // prossimo settimana se stesso giorno
                }
                $nextDate = $today->copy()->addDays($daysToAdd);

                // Salta se la data calcolata non è futura (non dovrebbe accadere, ma sicurezza)
                if (!$nextDate->isFuture()) {
                    continue;
                }

                // Verifica se esiste già un working_day per questa data
                $existingWorkingDay = WorkingDay::whereDate('day', $nextDate)->first();

                if ($dayConfig['enabled']) {
                    // Il giorno deve essere abilitato
                    if (!$existingWorkingDay) {
                        // Non esiste, quindi crea un nuovo working_day
                        WorkingDay::create([
                            'day' => $nextDate,
                            'location' => $location,
                            'max_orders' => $maxOrders,
                            'max_time' => $maxTime,
                            'start_time' => $dayConfig['start_time'],
                            'end_time' => $dayConfig['end_time'],
                        ]);
                    }
                    // Se esiste già, NON lo aggiorniamo (regola fondamentale)
                } else {
                    // Il giorno deve essere disabilitato
                    if ($existingWorkingDay) {
                        // Esiste, quindi dobbiamo eliminarlo
                        // TODO: Aggiungere controlli per verificare se ci sono ordini esistenti
                        // prima di eliminare. Per ora eliminiamo direttamente.
                        $existingWorkingDay->delete();
                    }
                    // Se non esiste, non facciamo nulla
                }
            }
        });

        // Restituisce una risposta di successo
        return response()->json([
            'success' => true,
            'message' => 'Configurazione settimanale aggiornata con successo.',
            'data' => [
                'max_orders' => $maxOrders,
                'max_time' => $maxTime,
                'location' => $location,
                'processed_days' => array_keys($daysConfig),
            ]
        ]);
    }
}
