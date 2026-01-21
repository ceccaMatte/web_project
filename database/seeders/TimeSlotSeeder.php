<?php

namespace Database\Seeders;

use App\Models\WorkingDay;
use App\Services\TimeSlotGeneratorService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TimeSlotSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $generator = new TimeSlotGeneratorService();
        $workingDays = WorkingDay::all();

        foreach ($workingDays as $workingDay) {
            $generator->generate($workingDay);
        }
    }
}