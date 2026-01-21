<?php

namespace Database\Seeders;

use App\Models\WorkingDay;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class WorkingDaySeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();
        // Working days
        WorkingDay::create([
            'day' => $today,
            'location' => 'Engineering Hub',
            'max_orders' => 50,
            'max_time' => 30,
        ]);
        // Giorno attivo domani
        WorkingDay::create([
            'day' => $tomorrow,
            'location' => 'Engineering Hub',
            'max_orders' => 50,
            'max_time' => 30,
        ]);
        // Giorno per dopodomani
        WorkingDay::create([
            'day' => $today->copy()->addDays(2),
            'location' => 'Engineering Hub',
            'max_orders' => 50,
            'max_time' => 30,
        ]);
    }
}