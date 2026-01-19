<?php

namespace App\Services;

use App\Models\WorkingDay;
use App\Models\TimeSlot;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
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
 * 
 * REGOLE BUSINESS:
 * - Giorni passati non sono modificabili
 * - Time slots vengono rigenerati quando cambiano start/end time
 * - Normalizzazione automatica orari a slot duration (15 min)
 */
class ServicePlanningService
{
    /**
     * Genera slots per una coppia start_time/end_time.
     * 
     * @param int $workingDayId
     * @param string $startTime (HH:MM)
     * @param string $endTime (HH:MM)
     */
    private function generateTimeSlots(int $workingDayId, string $startTime, string $endTime): void
    {
        $slotDuration = config('service_planning.time_slot_duration', 15);
        
        $start = Carbon::createFromFormat('H:i', $startTime);
        $end = Carbon::createFromFormat('H:i', $endTime);
        
        // Genera slots
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
            
            $start->addMinutes($slotDuration);
        }
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

        // Recupera working days esistenti per questa settimana
        $workingDays = WorkingDay::whereDate('day', '>=', $startDate)
            ->whereDate('day', '<=', $endDate)
            ->get()
            ->keyBy(function ($wd) {
                return Carbon::parse($wd->day)->format('Y-m-d');
            });

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

            $days[] = [
                'date' => $dateStr,
                'dayOfWeek' => $i,
                'dayName' => $dayNames[$i],
                'dayNameShort' => $dayNamesShort[$i],
                'dayNumber' => $date->day,
                'isActive' => $workingDay ? (bool) $workingDay->is_active : false,
                'startTime' => $workingDay ? substr($workingDay->start_time, 0, 5) : config('service_planning.default_day_start_time'),
                'endTime' => $workingDay ? substr($workingDay->end_time, 0, 5) : config('service_planning.default_day_end_time'),
                'isEditable' => $date->gte($today),
                'hasOrders' => $ordersCount > 0,
                'ordersCount' => $ordersCount,
            ];
        }

        return [
            'weekStart' => $startDate->format('Y-m-d'),
            'weekEnd' => $endDate->format('Y-m-d'),
            'isWeekEditable' => $endDate->gte($today),
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
     * @param array $data Dati validati dal controller
     * @throws \Exception
     */
    public function saveWeekConfiguration(array $data): void
    {
        $weekStart = Carbon::parse($data['weekStart'])->startOfWeek(Carbon::MONDAY);
        $today = Carbon::today();
        $globalConstraints = $data['globalConstraints'];
        $slotDuration = config('service_planning.time_slot_duration', 15);

        DB::transaction(function () use ($data, $weekStart, $today, $globalConstraints, $slotDuration) {
            foreach ($data['days'] as $dayData) {
                $date = Carbon::parse($dayData['date']);
                
                // Skip giorni passati
                if ($date->lt($today)) {
                    continue;
                }

                // Trova working day esistente
                $workingDay = WorkingDay::whereDate('day', $date->format('Y-m-d'))->first();

                // Normalizza orari
                $startTime = $this->normalizeTime($dayData['startTime'] ?? null, $slotDuration);
                $endTime = $this->normalizeTime($dayData['endTime'] ?? null, $slotDuration);

                // Assicurati che start < end
                if ($startTime && $endTime && $startTime >= $endTime) {
                    // Sposta end avanti di almeno uno slot
                    $endTime = $this->addMinutesToTime($startTime, $slotDuration);
                }

                if ($dayData['isActive']) {
                    // Giorno attivo: crea o aggiorna
                    $needsSlotRegeneration = false;

                    if ($workingDay) {
                        // Controlla se orari sono cambiati
                        $oldStart = substr($workingDay->start_time, 0, 5);
                        $oldEnd = substr($workingDay->end_time, 0, 5);
                        
                        if ($oldStart !== $startTime || $oldEnd !== $endTime) {
                            $needsSlotRegeneration = true;
                        }

                        // Aggiorna working day
                        $workingDay->update([
                            'is_active' => true,
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'max_orders' => $globalConstraints['maxOrdersPerSlot'],
                            'max_time' => $globalConstraints['maxPendingTime'],
                            'location' => $globalConstraints['location'],
                        ]);
                    } else {
                        // Crea nuovo working day
                        $workingDay = WorkingDay::create([
                            'day' => $date->format('Y-m-d'),
                            'is_active' => true,
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'max_orders' => $globalConstraints['maxOrdersPerSlot'],
                            'max_time' => $globalConstraints['maxPendingTime'],
                            'location' => $globalConstraints['location'],
                        ]);
                        $needsSlotRegeneration = true;
                    }

                    // Rigenera time slots se necessario
                    if ($needsSlotRegeneration) {
                        // Elimina vecchi slots (solo quelli senza ordini o con ordini cancellabili)
                        TimeSlot::where('working_day_id', $workingDay->id)
                            ->whereDoesntHave('orders')
                            ->delete();

                        // Verifica se ci sono slots rimanenti
                        $existingSlots = TimeSlot::where('working_day_id', $workingDay->id)->count();
                        
                        if ($existingSlots === 0) {
                            // Genera nuovi slots
                            $this->generateTimeSlots(
                                $workingDay->id,
                                $startTime,
                                $endTime
                            );
                        }
                    }
                    // Note: max_orders è ora sul working_day, non sui time_slots
                } else {
                    // Giorno inattivo
                    if ($workingDay) {
                        // Verifica se ci sono ordini
                        $hasOrders = TimeSlot::where('working_day_id', $workingDay->id)
                            ->whereHas('orders')
                            ->exists();

                        if ($hasOrders) {
                            // Ha ordini: metti solo is_active a false
                            $workingDay->update(['is_active' => false]);
                        } else {
                            // Nessun ordine: elimina slots e working day
                            TimeSlot::where('working_day_id', $workingDay->id)->delete();
                            $workingDay->delete();
                        }
                    }
                    // Se non esiste, non fare nulla (giorno già inattivo)
                }
            }
        });
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
