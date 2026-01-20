<?php

namespace App\Services;

use App\Models\WorkingDay;
use App\Models\TimeSlot;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

/**
 * ServicePlanningService
 * 
 * Servizio per la configurazione settimanale del servizio.
 * Gestisce lettura e salvataggio delle configurazioni per la pagina Service Planning.
 * 
 * RESPONSABILITÀ:
 * - Fetch configurazione settimana (global constraints + 7 giorni)
 * - Salvataggio configurazione con validazione e normalizzazione orari
 * - Rigenerazione time slots quando cambiano gli orari
 * - Gestione ordini REJECTED quando si riducono gli orari
 * 
 * REGOLE BUSINESS (VINCOLANTI):
 * - Settimane passate: NON modificabili
 * - Giorni <= oggi: NON modificabili
 * - Solo giorni > oggi sono modificabili
 * - Time slots vengono rigenerati quando cambiano start/end time
 * - Ordini vengono marcati REJECTED se il loro time slot viene cancellato
 */
class ServicePlanningService
{
    /**
     * Recupera la configurazione globale per Service Planning.
     * Contiene min/max per constraints, valori di default, slot duration.
     * 
     * @return array
     */
    public function getConfig(): array
    {
        Log::info('[ServicePlanningService] getConfig called');

        return [
            // Slot duration
            'slotDuration' => config('service_planning.time_slot_duration', 15),
            
            // Max orders per slot limits
            'minMaxOrdersPerSlot' => config('service_planning.min_max_orders_per_slot', 1),
            'maxMaxOrdersPerSlot' => config('service_planning.max_max_orders_per_slot', 99),
            'defaultMaxOrdersPerSlot' => config('service_planning.default_max_orders_per_slot', 10),
            
            // Max ingredients per order limits  
            'minMaxIngredientsPerOrder' => config('service_planning.min_max_ingredients', 1),
            'maxMaxIngredientsPerOrder' => config('service_planning.max_max_ingredients', 20),
            'defaultMaxIngredientsPerOrder' => config('service_planning.default_max_ingredients', 6),
            
            // Default times
            'defaultStartTime' => config('service_planning.default_day_start_time', '12:00'),
            'defaultStopTime' => config('service_planning.default_day_end_time', '14:00'),
            
            // Location
            'location' => config('service_planning.default_location', 'Sede principale'),
        ];
    }

    /**
     * Recupera la configurazione per una settimana.
     * 
     * @param string $weekStart Data del lunedì (YYYY-MM-DD)
     * @return array
     */
    public function getWeekConfiguration(string $weekStart): array
    {
        $startDate = Carbon::parse($weekStart)->startOfWeek(Carbon::MONDAY);
        $endDate = (clone $startDate)->addDays(6);
        $today = Carbon::today();

        Log::info('[ServicePlanningService] getWeekConfiguration', [
            'weekStart' => $startDate->format('Y-m-d'),
            'weekEnd' => $endDate->format('Y-m-d'),
            'today' => $today->format('Y-m-d'),
        ]);

        // Recupera working days esistenti per questa settimana
        $workingDays = WorkingDay::whereDate('day', '>=', $startDate)
            ->whereDate('day', '<=', $endDate)
            ->get()
            ->keyBy(function ($wd) {
                return Carbon::parse($wd->day)->format('Y-m-d');
            });

        // La settimana ha dati persistiti?
        $hasPersistedData = $workingDays->isNotEmpty();

        // Deduce global constraints dal primo working day attivo, o usa config defaults
        $globalConstraints = $this->deduceGlobalConstraints($workingDays);

        // Costruisci configurazione per i 7 giorni
        $days = [];
        $dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $dayNamesShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        for ($i = 0; $i < 7; $i++) {
            $date = (clone $startDate)->addDays($i);
            $dateStr = $date->format('Y-m-d');
            $workingDay = $workingDays->get($dateStr);

            // Conta ordini per questo giorno (se esiste)
            $ordersCount = 0;
            if ($workingDay) {
                $ordersCount = TimeSlot::where('working_day_id', $workingDay->id)
                    ->withCount('orders')
                    ->get()
                    ->sum('orders_count');
            }

            // REGOLA TEMPORALE: giorno editabile solo se strettamente > oggi
            $isEditable = $date->gt($today);

            $days[] = [
                'date' => $dateStr,
                'dayOfWeek' => $i,
                'dayName' => $dayNames[$i],
                'dayNameShort' => $dayNamesShort[$i],
                'dayNumber' => $date->day,
                'isActive' => $workingDay ? (bool) $workingDay->is_active : false,
                'startTime' => $workingDay ? substr($workingDay->start_time, 0, 5) : config('service_planning.default_day_start_time'),
                'endTime' => $workingDay ? substr($workingDay->end_time, 0, 5) : config('service_planning.default_day_end_time'),
                'isEditable' => $isEditable,
                'hasOrders' => $ordersCount > 0,
                'ordersCount' => $ordersCount,
            ];
        }

        // La settimana è editabile se contiene almeno un giorno > oggi
        $isWeekEditable = $endDate->gt($today);

        return [
            'weekStart' => $startDate->format('Y-m-d'),
            'weekEnd' => $endDate->format('Y-m-d'),
            'isWeekEditable' => $isWeekEditable,
            'hasPersistedData' => $hasPersistedData,
            'globalConstraints' => $globalConstraints,
            'days' => $days,
            'config' => [
                'timeSlotDuration' => config('service_planning.time_slot_duration', 15),
            ],
        ];
    }

    /**
     * Deduce global constraints dai working days esistenti.
     * Usa il primo working day attivo, altrimenti config defaults.
     * 
     * @param Collection $workingDays
     * @return array
     */
    private function deduceGlobalConstraints(Collection $workingDays): array
    {
        $activeDay = $workingDays->first(fn($wd) => $wd->is_active);

        if ($activeDay) {
            return [
                'maxOrdersPerSlot' => $activeDay->max_orders ?? config('service_planning.default_max_orders_per_slot'),
                'maxPendingTime' => $activeDay->max_time ?? config('service_planning.default_max_pending_time'),
                'location' => $activeDay->location ?? config('service_planning.default_location'),
            ];
        }

        return [
            'maxOrdersPerSlot' => config('service_planning.default_max_orders_per_slot'),
            'maxPendingTime' => config('service_planning.default_max_pending_time'),
            'location' => config('service_planning.default_location'),
        ];
    }

    /**
     * Salva la configurazione per una settimana.
     * 
     * REGOLE VINCOLANTI:
     * - Settimana passata: RIFIUTATA (saved = false)
     * - Giorni <= oggi: IGNORATI (skipped)
     * - Solo giorni > oggi vengono processati
     * 
     * @param string $weekStart Data del lunedì (YYYY-MM-DD)
     * @param array $globalConstraints Constraints globali (maxOrdersPerSlot, maxIngredientsPerOrder)
     * @param array $days Array di configurazioni giorni
     * @return array { saved: bool, message: string, report: array }
     */
    public function saveWeekConfiguration(string $weekStart, array $globalConstraints, array $days): array
    {
        $startDate = Carbon::parse($weekStart)->startOfWeek(Carbon::MONDAY);
        $endDate = (clone $startDate)->addDays(6);
        $today = Carbon::today();

        Log::info('[ServicePlanningService] saveWeekConfiguration - INIZIO', [
            'weekStart' => $startDate->format('Y-m-d'),
            'weekEnd' => $endDate->format('Y-m-d'),
            'today' => $today->format('Y-m-d'),
            'globalConstraints' => $globalConstraints,
            'daysCount' => count($days),
        ]);

        // VALIDAZIONE: settimana non deve essere completamente passata
        if ($endDate->lt($today)) {
            Log::warning('[ServicePlanningService] RIFIUTATO - settimana passata', [
                'weekEnd' => $endDate->format('Y-m-d'),
                'today' => $today->format('Y-m-d'),
            ]);
            return [
                'saved' => false,
                'message' => 'Impossibile modificare una settimana completamente passata.',
                'report' => null,
            ];
        }

        $slotDuration = config('service_planning.time_slot_duration', 15);

        // Report delle operazioni
        $report = [
            'daysCreated' => 0,
            'daysUpdated' => 0,
            'daysDisabled' => 0,
            'daysSkipped' => 0,
            'timeSlotsGenerated' => 0,
            'timeSlotsDeleted' => 0,
            'ordersRejected' => 0,
        ];

        DB::transaction(function () use ($days, $startDate, $today, $globalConstraints, $slotDuration, &$report) {
            foreach ($days as $dayData) {
                $date = Carbon::parse($dayData['date']);
                $dateStr = $date->format('Y-m-d');
                
                // VALIDAZIONE: Skip giorni <= oggi
                if ($date->lte($today)) {
                    Log::info('[ServicePlanningService] Skip giorno non modificabile', [
                        'date' => $dateStr,
                        'reason' => 'date <= today',
                    ]);
                    $report['daysSkipped']++;
                    continue;
                }

                // Trova working day esistente
                $workingDay = WorkingDay::whereDate('day', $dateStr)->first();

                // Normalizza orari (frontend usa stopTime, backend usa end_time)
                $startTime = $this->normalizeTime($dayData['startTime'] ?? null, $slotDuration);
                $endTime = $this->normalizeTime($dayData['stopTime'] ?? $dayData['endTime'] ?? null, $slotDuration);

                // Assicurati che start < end
                if ($startTime && $endTime && $startTime >= $endTime) {
                    $endTime = $this->addMinutesToTime($startTime, $slotDuration);
                }

                if ($dayData['isActive']) {
                    // ================================
                    // CASO: Giorno ATTIVO
                    // ================================
                    $this->processActiveDay(
                        $workingDay,
                        $date,
                        $startTime,
                        $endTime,
                        $globalConstraints,
                        $slotDuration,
                        $report
                    );
                } else {
                    // ================================
                    // CASO: Giorno INATTIVO
                    // ================================
                    $this->processInactiveDay(
                        $workingDay,
                        $date,
                        $report
                    );
                }
            }
        });

        Log::info('[ServicePlanningService] saveWeekConfiguration - FINE', $report);

        return [
            'saved' => true,
            'message' => 'Configurazione salvata con successo.',
            'report' => $report,
        ];
    }

    /**
     * Processa un giorno che deve essere ATTIVO
     */
    private function processActiveDay(
        ?WorkingDay $workingDay,
        Carbon $date,
        string $startTime,
        string $endTime,
        array $globalConstraints,
        int $slotDuration,
        array &$report
    ): void {
        $dateStr = $date->format('Y-m-d');
        $needsSlotRegeneration = false;

        if ($workingDay) {
            // Working day esistente - AGGIORNAMENTO
            $oldStart = substr($workingDay->start_time, 0, 5);
            $oldEnd = substr($workingDay->end_time, 0, 5);

            // Controlla se orari sono cambiati
            if ($oldStart !== $startTime || $oldEnd !== $endTime) {
                Log::info('[ServicePlanningService] Orari cambiati', [
                    'date' => $dateStr,
                    'old' => "{$oldStart} - {$oldEnd}",
                    'new' => "{$startTime} - {$endTime}",
                ]);
                
                // Gestisci riduzione orario (ordini da REJECTED)
                $this->handleTimeRangeReduction(
                    $workingDay,
                    $oldStart,
                    $oldEnd,
                    $startTime,
                    $endTime,
                    $report
                );
                
                $needsSlotRegeneration = true;
            }

            // Aggiorna working day
            $workingDay->update([
                'is_active' => true,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'max_orders' => $globalConstraints['maxOrdersPerSlot'],
                'max_time' => $globalConstraints['maxPendingTime'] ?? config('service_planning.default_max_pending_time'),
                'location' => $globalConstraints['location'] ?? config('service_planning.default_location'),
            ]);

            $report['daysUpdated']++;

        } else {
            // Working day NON esistente - CREAZIONE
            $workingDay = WorkingDay::create([
                'day' => $dateStr,
                'is_active' => true,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'max_orders' => $globalConstraints['maxOrdersPerSlot'],
                'max_time' => $globalConstraints['maxPendingTime'] ?? config('service_planning.default_max_pending_time'),
                'location' => $globalConstraints['location'] ?? config('service_planning.default_location'),
            ]);

            Log::info('[ServicePlanningService] Working day creato', [
                'date' => $dateStr,
                'id' => $workingDay->id,
            ]);

            $report['daysCreated']++;
            $needsSlotRegeneration = true;
        }

        // Rigenera time slots se necessario
        if ($needsSlotRegeneration) {
            $this->regenerateTimeSlots($workingDay, $startTime, $endTime, $slotDuration, $report);
        }
    }

    /**
     * Processa un giorno che deve essere INATTIVO
     */
    private function processInactiveDay(
        ?WorkingDay $workingDay,
        Carbon $date,
        array &$report
    ): void {
        $dateStr = $date->format('Y-m-d');

        if (!$workingDay) {
            // Non esiste, nulla da fare
            return;
        }

        // Verifica se ci sono ordini
        $timeSlotIds = TimeSlot::where('working_day_id', $workingDay->id)
            ->pluck('id');
        
        $hasOrders = Order::whereIn('time_slot_id', $timeSlotIds)->exists();

        if ($hasOrders) {
            // Ha ordini: marca come REJECTED e disattiva
            $rejectedCount = Order::whereIn('time_slot_id', $timeSlotIds)
                ->whereIn('status', ['pending', 'confirmed'])
                ->update(['status' => 'rejected']);

            Log::info('[ServicePlanningService] Ordini marcati REJECTED', [
                'date' => $dateStr,
                'count' => $rejectedCount,
            ]);

            $report['ordersRejected'] += $rejectedCount;

            $workingDay->update(['is_active' => false]);
            $report['daysDisabled']++;

        } else {
            // Nessun ordine: elimina slots e working day
            $deletedSlots = TimeSlot::where('working_day_id', $workingDay->id)->delete();
            $workingDay->delete();

            Log::info('[ServicePlanningService] Working day eliminato', [
                'date' => $dateStr,
                'deletedSlots' => $deletedSlots,
            ]);

            $report['timeSlotsDeleted'] += $deletedSlots;
            $report['daysDisabled']++;
        }
    }

    /**
     * Gestisce la riduzione dell'intervallo orario
     * Marca come REJECTED gli ordini nei time slot che verranno eliminati
     */
    private function handleTimeRangeReduction(
        WorkingDay $workingDay,
        string $oldStart,
        string $oldEnd,
        string $newStart,
        string $newEnd,
        array &$report
    ): void {
        // Trova time slots fuori dal nuovo range
        $slotsToRemove = TimeSlot::where('working_day_id', $workingDay->id)
            ->where(function ($query) use ($newStart, $newEnd) {
                // Slot che iniziano prima del nuovo start O finiscono dopo il nuovo end
                $query->where('start_time', '<', $newStart)
                      ->orWhere('end_time', '>', $newEnd);
            })
            ->get();

        foreach ($slotsToRemove as $slot) {
            // Marca ordini come REJECTED
            $rejectedCount = Order::where('time_slot_id', $slot->id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->update(['status' => 'rejected']);

            if ($rejectedCount > 0) {
                Log::info('[ServicePlanningService] Ordini REJECTED per riduzione orario', [
                    'slotId' => $slot->id,
                    'count' => $rejectedCount,
                ]);
                $report['ordersRejected'] += $rejectedCount;
            }

            // Elimina il time slot
            $slot->delete();
            $report['timeSlotsDeleted']++;
        }
    }

    /**
     * Rigenera i time slots per un working day
     */
    private function regenerateTimeSlots(
        WorkingDay $workingDay,
        string $startTime,
        string $endTime,
        int $slotDuration,
        array &$report
    ): void {
        // Elimina vecchi slots senza ordini
        $deletedCount = TimeSlot::where('working_day_id', $workingDay->id)
            ->whereDoesntHave('orders')
            ->delete();

        $report['timeSlotsDeleted'] += $deletedCount;

        // Verifica se ci sono slots rimanenti (con ordini)
        $existingSlots = TimeSlot::where('working_day_id', $workingDay->id)->count();

        if ($existingSlots === 0) {
            // Genera nuovi slots
            $createdCount = $this->generateTimeSlots(
                $workingDay->id,
                $startTime,
                $endTime,
                $slotDuration
            );
            $report['timeSlotsGenerated'] += $createdCount;
        } else {
            Log::info('[ServicePlanningService] Slots con ordini esistenti, non rigenero', [
                'workingDayId' => $workingDay->id,
                'existingSlots' => $existingSlots,
            ]);
        }
    }

    /**
     * Genera slots per una coppia start_time/end_time.
     * 
     * @param int $workingDayId
     * @param string $startTime (HH:MM)
     * @param string $endTime (HH:MM)
     * @param int $slotDuration
     * @return int Numero di slots creati
     */
    private function generateTimeSlots(int $workingDayId, string $startTime, string $endTime, int $slotDuration): int
    {
        $start = Carbon::createFromFormat('H:i', $startTime);
        $end = Carbon::createFromFormat('H:i', $endTime);
        $count = 0;

        while ($start->lt($end)) {
            $slotEnd = (clone $start)->addMinutes($slotDuration);

            // Assicurati di non superare end_time
            if ($slotEnd->gt($end)) {
                $slotEnd = $end;
            }

            TimeSlot::create([
                'working_day_id' => $workingDayId,
                'start_time' => $start->format('H:i:s'),
                'end_time' => $slotEnd->format('H:i:s'),
            ]);

            $count++;
            $start->addMinutes($slotDuration);
        }

        Log::info('[ServicePlanningService] Time slots generati', [
            'workingDayId' => $workingDayId,
            'count' => $count,
            'range' => "{$startTime} - {$endTime}",
        ]);

        return $count;
    }

    /**
     * Normalizza un orario al multiplo più vicino della durata slot.
     * 
     * @param string|null $time Orario in formato HH:MM
     * @param int $slotDuration Durata slot in minuti
     * @return string Orario normalizzato
     */
    private function normalizeTime(?string $time, int $slotDuration): string
    {
        if (!$time) {
            return config('service_planning.default_day_start_time');
        }

        // Parse time
        $parts = explode(':', $time);
        $hours = (int) ($parts[0] ?? 0);
        $minutes = (int) ($parts[1] ?? 0);

        // Arrotonda al multiplo più vicino
        $totalMinutes = $hours * 60 + $minutes;
        $normalizedMinutes = round($totalMinutes / $slotDuration) * $slotDuration;

        // Evita overflow 24:00
        if ($normalizedMinutes >= 24 * 60) {
            $normalizedMinutes = 24 * 60 - $slotDuration;
        }

        $normalizedHours = floor($normalizedMinutes / 60);
        $normalizedMins = $normalizedMinutes % 60;

        return sprintf('%02d:%02d', $normalizedHours, $normalizedMins);
    }

    /**
     * Aggiunge minuti a un orario.
     * 
     * @param string $time Orario HH:MM
     * @param int $minutes Minuti da aggiungere
     * @return string Nuovo orario HH:MM
     */
    private function addMinutesToTime(string $time, int $minutes): string
    {
        $parts = explode(':', $time);
        $totalMinutes = ((int) $parts[0]) * 60 + ((int) $parts[1]) + $minutes;

        if ($totalMinutes >= 24 * 60) {
            $totalMinutes = 24 * 60 - 15; // 23:45 max
        }

        return sprintf('%02d:%02d', floor($totalMinutes / 60), $totalMinutes % 60);
    }
}
