<?php

namespace Database\Factories;

use App\Models\WorkingDay;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TimeSlot>
 */
class TimeSlotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'working_day_id' => WorkingDay::factory(),
            'start_time' => '12:00',
            'end_time' => '12:15',
        ];
    }
}

