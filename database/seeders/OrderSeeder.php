<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\WorkingDay;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::where('enabled', true)->get();
        $workingDay = WorkingDay::first();
        
        if (!$workingDay) {
            $this->command->warn('No working days found. Run WorkingDaySeeder first.');
            return;
        }
        
        $timeSlots = TimeSlot::where('working_day_id', $workingDay->id)->get();

        if ($users->isEmpty() || $timeSlots->isEmpty()) {
            $this->command->warn('No users or time slots found. Run UserSeeder and TimeSlotSeeder first.');
            return;
        }

        // Ordini di esempio
        $mario = $users->where('email', 'mario@example.com')->first();
        if ($mario) {
            Order::create([
                'user_id' => $mario->id,
                'time_slot_id' => $timeSlots->first()->id,
                'working_day_id' => $workingDay->id,
                'status' => 'pending',
                'daily_number' => 1,
            ]);
        }
        // altro ordine di esempio
        $giulia = $users->where('email', 'giulia@example.com')->first();
        if ($giulia) {
            Order::create([
                'user_id' => $giulia->id,
                'time_slot_id' => $timeSlots->skip(1)->first()->id ?? $timeSlots->first()->id,
                'working_day_id' => $workingDay->id,
                'status' => 'ready',
                'daily_number' => 2,
            ]);
        }
        // ordine confermato
        if ($mario) {
            Order::create([
                'user_id' => $mario->id,
                'time_slot_id' => $timeSlots->skip(2)->first()->id ?? $timeSlots->first()->id,
                'working_day_id' => $workingDay->id,
                'status' => 'confirmed',
                'daily_number' => 3,
            ]);
        }
        // Ingredienti non aggiunti (intenzionale)
    }
}