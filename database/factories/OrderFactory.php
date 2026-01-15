<?php

namespace Database\Factories;

use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $timeSlot = TimeSlot::factory()->create();
        
        return [
            'user_id' => User::factory(),
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $timeSlot->working_day_id,
            'daily_number' => $this->faker->numberBetween(1, 100),
            'status' => 'pending',
        ];
    }

    /**
     * State per ordine confermato.
     */
    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'confirmed',
        ]);
    }

    /**
     * State per ordine pronto.
     */
    public function ready(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'ready',
        ]);
    }

    /**
     * State per ordine ritirato.
     */
    public function pickedUp(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'picked_up',
        ]);
    }

    /**
     * State per ordine rifiutato.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
        ]);
    }
}
