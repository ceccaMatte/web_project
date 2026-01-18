<?php

namespace Database\Seeders;

use App\Models\WorkingDay;
use App\Services\TimeSlotGeneratorService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class TestWorkingDaySeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     * Crea un giorno lavorativo per oggi (18/01/2026) con orari 14:00-18:00
     * per permettere i test anche di domenica.
     */
    public function run(): void
    {
        $today = Carbon::create(2026, 1, 18); // Oggi: 18/01/2026

        // Crea il working day per oggi con orari 14:00-18:00
        $workingDay = WorkingDay::create([
            'day' => $today,
            'location' => 'Engineering Hub - Test Day',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '14:00:00',
            'end_time' => '18:00:00',
        ]);

        // Genera automaticamente i time slot usando il service
        $generator = new TimeSlotGeneratorService();
        $slotsCreated = $generator->generate($workingDay);

        $this->command->info("Created working day for {$today->format('d/m/Y')} with {$slotsCreated} time slots (14:00-18:00)");
    }
}