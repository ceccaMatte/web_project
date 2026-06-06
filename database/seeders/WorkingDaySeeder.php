<?php

namespace Database\Seeders;

use App\Models\WorkingDay;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Seeder per i giorni lavorativi.
 *
 * Crea i giorni feriali della settimana corrente e della settimana prossima,
 * usando date dinamiche rispetto al giorno in cui viene eseguito il seeding.
 */
class WorkingDaySeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $config = config('panini');

        $today = Carbon::today();
        $currentWeekStart = $today->clone()->startOfWeek(Carbon::MONDAY);
        $periodStart = $currentWeekStart->clone();
        $periodEnd = $currentWeekStart->clone()->addWeek()->endOfWeek(Carbon::FRIDAY);

        $currentDate = $periodStart->clone();

        while ($currentDate <= $periodEnd) {
            if ($currentDate->isWeekday()) {
                $dateWeekStart = $currentDate->clone()->startOfWeek(Carbon::MONDAY);
                $isCurrentWeek = $dateWeekStart->isSameDay($currentWeekStart);
                $schedule = $isCurrentWeek
                    ? $config['current_week']
                    : $config['past_weeks'];

                WorkingDay::create([
                    'day' => $currentDate->clone(),
                    'location' => $config['default_location'],
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time'],
                    'max_orders' => 10,
                    'max_time' => 30,
                    'is_active' => true,
                ]);
            }

            $currentDate->addDay();
        }
    }
}
