<?php

namespace App\Services;

use App\Models\TimeSlot;
use App\Models\WorkingDay;
use Carbon\Carbon;

/**
 * Service per la generazione automatica degli slot temporali.
 * 
 * Responsabilità:
 * - Genera slot temporali contigui da un working_day
 * - Garantisce idempotenza (no duplicati)
 * - Usa la durata configurata in config/time_slots.php
 * 
 * Perché esiste questo service?
 * - Separazione delle responsabilità (SOLID)
 * - Logica di generazione isolata e testabile
 * - Riutilizzabile in contesti diversi
 * - Nessun side effect nascosto
 * 
 * Perché la durata è una costante?
 * - Garantisce prevedibilità del sistema
 * - Semplifica la gestione degli ordini
 * - Evita incoerenze tra giorni diversi
 * 
 * Perché la generazione è deterministica?
 * - Slot identici a parità di working_day
 * - Facilita il testing
 * - Comportamento prevedibile
 */
class TimeSlotGeneratorService
{
    /**
     * Genera gli slot temporali per un working_day.
     * 
     * La generazione è idempotente: se chiamata più volte
     * per lo stesso working_day, non crea duplicati.
     * 
     * @param WorkingDay $workingDay Il giorno lavorativo per cui generare gli slot
     * @return int Numero di slot creati
     */
    public function generate(WorkingDay $workingDay): int
    {
        // Verifica idempotenza: se esistono già slot, non fare nulla
        if ($workingDay->timeSlots()->exists()) {
            return 0;
        }

        // Ottiene la durata configurata degli slot
        $durationMinutes = config('time_slots.duration_minutes');

        // Prepara gli orari di inizio e fine
        $startTime = Carbon::parse($workingDay->start_time);
        $endTime = Carbon::parse($workingDay->end_time);

        // Array per raccogliere gli slot da creare
        $slots = [];
        $currentTime = $startTime->copy();

        // Genera tutti gli slot nell'intervallo [start_time, end_time)
        while ($currentTime->lessThan($endTime)) {
            $slotEnd = $currentTime->copy()->addMinutes($durationMinutes);

            // Se lo slot supera l'orario di fine, lo tronca
            if ($slotEnd->greaterThan($endTime)) {
                $slotEnd = $endTime->copy();
            }

            // Aggiunge lo slot all'array
            $slots[] = [
                'working_day_id' => $workingDay->id,
                'start_time' => $currentTime->format('H:i:s'),
                'end_time' => $slotEnd->format('H:i:s'),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            // Avanza al prossimo slot
            $currentTime = $slotEnd->copy();
        }

        // Inserisce tutti gli slot in un'unica operazione (performance)
        if (!empty($slots)) {
            TimeSlot::insert($slots);
        }

        return count($slots);
    }

    /**
     * Cancella tutti gli slot di un working_day.
     * 
     * Utile per cleanup manuale, anche se normalmente
     * la cancellazione avviene tramite cascade sul DB.
     * 
     * @param WorkingDay $workingDay Il giorno lavorativo
     * @return int Numero di slot cancellati
     */
    public function delete(WorkingDay $workingDay): int
    {
        return $workingDay->timeSlots()->delete();
    }
}
