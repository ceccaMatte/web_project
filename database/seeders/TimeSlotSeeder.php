<?php

namespace Database\Seeders;

use App\Models\WorkingDay;
use App\Services\TimeSlotGeneratorService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TimeSlotSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $generator = new TimeSlotGeneratorService();

        // Genera slot per tutti i working days
        $workingDays = WorkingDay::all();

        foreach ($workingDays as $workingDay) {
            $slotsCreated = $generator->generate($workingDay);
            $this->command->info("Generated {$slotsCreated} time slots for working day {$workingDay->day->format('Y-m-d')}");
        }
    }
}