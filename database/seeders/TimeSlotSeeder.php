<?php

namespace Database\Seeders;

use App\Models\TimeSlot;
use App\Models\WorkingDay;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Seeder per i time slot (slot temporali prenotabili).
 * 
 * LOGICA:
 * 1. Per ogni working_day ATTIVO (is_active=true):
 *    - Genera slot da 15 minuti (costante da config/panini.php)
 *    - Dalla start_time alla end_time del working_day
 * 
 * 2. Per giorni SOSPESI (is_active=false):
 *    - NON crea alcuno slot
 *    - Questo evita errori di vincoli e logica
 * 
 * ORARI TOTALI:
 * - Settimane passate: 11:30-14:30 = 180 minuti = 12 slot
 * - Settimana corrente: 10:30-15:00 = 270 minuti = 18 slot
 * 
 * ESEMPIO:
 * - Working day: 2026-01-29, 10:30-15:00
 * - Slot 1: 10:30-10:45
 * - Slot 2: 10:45-11:00
 * - ... (fino a slot 18)
 * - Slot 18: 14:45-15:00
 */
class TimeSlotSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Carica configurazione
        $config = config('panini');
        $slotDurationMinutes = $config['time_slot_minutes'];

        /**
         * Recupera tutti i working_days ATTIVI dal DB.
         * Solo questi riceveranno gli slot.
         */
        $activeWorkingDays = WorkingDay::where('is_active', true)->get();

        foreach ($activeWorkingDays as $workingDay) {
            /**
             * Converte start_time e end_time (stringhe HH:MM) in minuti assoluti dal giorno.
             * Es: "10:30" → 630 minuti, "15:00" → 900 minuti
             */
            $startParts = explode(':', $workingDay->start_time);
            $startMinutes = (int)$startParts[0] * 60 + (int)$startParts[1];

            $endParts = explode(':', $workingDay->end_time);
            $endMinutes = (int)$endParts[0] * 60 + (int)$endParts[1];

            /**
             * Genera i time slot partendo da startMinutes fino a endMinutes.
             * Ogni iterazione crea uno slot di durata slotDurationMinutes.
             */
            $currentMinutes = $startMinutes;

            while ($currentMinutes + $slotDurationMinutes <= $endMinutes) {
                // Converte i minuti assoluti indietro in formato HH:MM
                $slotStartTime = $this->minutesToTimeString($currentMinutes);
                $slotEndTime = $this->minutesToTimeString($currentMinutes + $slotDurationMinutes);

                /**
                 * Crea il time slot nel database.
                 * 
                 * NOTA: gli ordini verranno associati tramite time_slot_id.
                 * Il conteggio degli ordini per slot dovrà essere limitato a
                 * max_orders_per_slot (valore da config/panini.php).
                 */
                TimeSlot::create([
                    'working_day_id' => $workingDay->id,
                    'start_time' => $slotStartTime,
                    'end_time' => $slotEndTime,
                ]);

                // Avanza al prossimo slot
                $currentMinutes += $slotDurationMinutes;
            }
        }
    }

    /**
     * Converte minuti assoluti dal giorno (0-1439) in stringa HH:MM.
     * 
     * ESEMPIO:
     * - 0 → "00:00"
     * - 630 → "10:30"
     * - 900 → "15:00"
     * 
     * @param int $minutes Minuti dal inizio del giorno (0-1439)
     * @return string Formato HH:MM
     */
    private function minutesToTimeString(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $mins = $minutes % 60;
        return sprintf('%02d:%02d', $hours, $mins);
    }
}