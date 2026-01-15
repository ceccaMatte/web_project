<?php

namespace Database\Seeders;

use App\Models\WorkingDay;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class WorkingDaySeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        // Giorno attivo oggi (servizio attivo)
        WorkingDay::create([
            'day' => $today,
            'location' => 'Engineering Hub',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '11:00',
            'end_time' => '14:00',
            'is_active' => true,
        ]);

        // Giorno attivo domani (per pre-booking)
        WorkingDay::create([
            'day' => $tomorrow,
            'location' => 'Engineering Hub',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '11:00',
            'end_time' => '14:00',
            'is_active' => true,
        ]);

        // Giorno inattivo (servizio non attivo)
        WorkingDay::create([
            'day' => $today->copy()->addDays(2),
            'location' => 'Engineering Hub',
            'max_orders' => 50,
            'max_time' => 30,
            'start_time' => '11:00',
            'end_time' => '14:00',
            'is_active' => false,
        ]);
    }
}