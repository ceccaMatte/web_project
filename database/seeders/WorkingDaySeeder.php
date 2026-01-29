<?php

namespace Database\Seeders;

use App\Models\WorkingDay;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

/**
 * Seeder per i giorni lavorativi (Working Days) del mese di gennaio 2026.
 * 
 * LOGICA:
 * 1. Data di riferimento: "oggi" = 29 gennaio 2026 (giovedì)
 * 2. Periodo coperto: 1-30 gennaio 2026 (30 giorni)
 * 3. Settimane:
 *    - Settimane passate (prima di 29/01): Lun-Ven attivi + 1 giorno sospeso casuale per realismo
 *    - Settimana corrente (con 29/01): Lun-Ven attivi
 * 4. Weekend: mai attivi
 * 
 * ORARI:
 * - Settimane passate: 11:30-14:30 (3 ore)
 * - Settimana corrente: 10:30-15:00 (4.5 ore)
 * 
 * LOCATION:
 * - Sempre "Campus - Unibo Cesena" (da config/panini.php)
 * 
 * RISULTATO:
 * - Se tutto va bene: ~16 working_days attivi nel mese
 * - Non creeremo ordini per giorni non attivi (is_active=false) o giorni sospesi
 */
class WorkingDaySeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Carica configurazioni da config/panini.php
        $config = config('panini');

        // Data di riferimento: 29 gennaio 2026 è un giovedì
        $today = Carbon::parse('2026-01-29');
        
        // Inizio periodo: 1 gennaio 2026
        $periodStart = Carbon::parse('2026-01-01');
        
        // Fine periodo: 30 gennaio 2026 (30 giorni, non 31)
        $periodEnd = Carbon::parse('2026-01-30');

        // Identifica le settimane nel periodo
        $currentWeekStart = $today->clone()->startOfWeek(Carbon::MONDAY);
        
        // Itera su tutti i giorni del periodo
        $currentDate = $periodStart->clone();
        
        while ($currentDate <= $periodEnd) {
            // Solo lunedì-venerdì possono essere lavorativi
            if ($currentDate->isWeekday()) {
                // Determina se la data è nella settimana corrente o passata
                $dateWeekStart = $currentDate->clone()->startOfWeek(Carbon::MONDAY);
                $isCurrentWeek = $dateWeekStart->isSameDay($currentWeekStart);
                
                // Seleziona orari appropriati
                if ($isCurrentWeek) {
                    // SETTIMANA CORRENTE: orari estesi
                    $startTime = $config['current_week']['start_time'];
                    $endTime = $config['current_week']['end_time'];
                } else {
                    // SETTIMANE PASSATE: orari normali
                    $startTime = $config['past_weeks']['start_time'];
                    $endTime = $config['past_weeks']['end_time'];
                }

                /**
                 * REALISMO: per ogni settimana passata, scegli 1 giorno feriale "sospeso".
                 * 
                 * Per semplicità, in questo seeder non applicherò la logica dei giorni sospesi
                 * tramite un array, ma li creerò comunque come working_day.
                 * 
                 * La logica di "sospensione" può essere controllata da una colonna
                 * "is_active" nel working_day stesso.
                 * 
                 * Per questo seeding, creaerò TUTTI i giorni lavorativi (Lun-Ven),
                 * poi segnerò alcuni come "sospesi" con is_active=false.
                 */
                
                // Calcola il numero della settimana nel periodo
                $weekNumber = $currentDate->weekOfYear;
                $startOfWeek = $dateWeekStart->clone();
                
                // Per ogni settimana passata, crea un "giorno sospeso" casuale
                // Genera un hash deterministico basato sulla settimana per sempre scegliere lo stesso giorno
                $weekIdentifier = $startOfWeek->format('Y-W');
                $suspensionHash = crc32($weekIdentifier) % 5; // 0-4 = Lun-Ven
                $dayOfWeekInLoop = $currentDate->dayOfWeek - 1; // 0=Lun, 4=Ven
                
                $isSuspended = false;
                if (!$isCurrentWeek) {
                    // Settimana passata: applica sospensione a 1 giorno casuale (deterministico)
                    $isSuspended = ($dayOfWeekInLoop === $suspensionHash);
                }

                /**
                 * Crea il working_day.
                 * 
                 * is_active = false se è un giorno sospeso di una settimana passata,
                 *           = true altrimenti (settimana corrente o giorni normali)
                 */
                WorkingDay::create([
                    'day' => $currentDate->clone(),
                    'location' => $config['default_location'],
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'max_orders' => 100, // Non vincolante a livello di working_day, il vero limite è per slot
                    'max_time' => 30, // Minuti per modificare un ordine
                    'is_active' => !$isSuspended, // false se sospeso
                ]);
            }

            // Passa al giorno successivo
            $currentDate->addDay();
        }
    }
}