<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminWeeklyConfigurationRequest;
use App\Models\WorkingDay;
use App\Services\TimeSlotGeneratorService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

// Gestisce la configurazione settimanale admin (non modifica giorni passati)
class AdminWeeklyConfigurationController extends Controller
{
    private TimeSlotGeneratorService $timeSlotGenerator;

    public function __construct(TimeSlotGeneratorService $timeSlotGenerator)
    {
        $this->timeSlotGenerator = $timeSlotGenerator;
    }

    public function updateWeeklyConfiguration(AdminWeeklyConfigurationRequest $request): JsonResponse
    {
        // parametri validati
        $maxOrders = $request->input('max_orders');
        $maxTime = $request->input('max_time');
        $location = $request->input('location');
        $daysConfig = $request->input('days');

        // riferimento: oggi
        $today = Carbon::today();

        // mappa giorno->costante Carbon
        $dayMappings = [
            'monday' => Carbon::MONDAY,
            'tuesday' => Carbon::TUESDAY,
            'wednesday' => Carbon::WEDNESDAY,
            'thursday' => Carbon::THURSDAY,
            'friday' => Carbon::FRIDAY,
            'saturday' => Carbon::SATURDAY,
            'sunday' => Carbon::SUNDAY,
        ];

        // applica modifiche solo a giorni futuri; operazione atomica
        DB::transaction(function () use ($daysConfig, $dayMappings, $today, $maxOrders, $maxTime, $location) {
            foreach ($daysConfig as $dayName => $dayConfig) {
                // calcola prossima occorrenza
                $currentDayOfWeek = $today->dayOfWeek;
                $targetDayOfWeek = $dayMappings[$dayName];
                $daysToAdd = ($targetDayOfWeek - $currentDayOfWeek + 7) % 7;
                if ($daysToAdd == 0) {
                    $daysToAdd = 7; // prossimo settimana se stesso giorno
                }
                $nextDate = $today->copy()->addDays($daysToAdd);

                // ignora date non future
                if (!$nextDate->isFuture()) {
                    continue;
                }

                // esistenza working_day per la data
                $existingWorkingDay = WorkingDay::whereDate('day', $nextDate)->first();

                if ($dayConfig['enabled']) {
                    if (!$existingWorkingDay) {
                        $workingDay = WorkingDay::create([
                            'day' => $nextDate,
                            'location' => $location,
                            'max_orders' => $maxOrders,
                            'max_time' => $maxTime,
                            'start_time' => $dayConfig['start_time'],
                            'end_time' => $dayConfig['end_time'],
                        ]);

                        // genera slot in stessa transazione
                        $this->timeSlotGenerator->generate($workingDay);
                    }
                    // non sovrascrive existing working_day
                } else {
                    if ($existingWorkingDay) {
                        // TODO: verificare ordini prima dell'eliminazione
                        $existingWorkingDay->delete();
                    }
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
