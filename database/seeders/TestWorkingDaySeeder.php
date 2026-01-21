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

    public function run(): void
    {
        // Test day fixed for reproducible slots
        $today = Carbon::create(2026, 1, 18);
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

        // finished
    }
}