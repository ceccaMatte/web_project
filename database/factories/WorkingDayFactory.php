<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WorkingDay>
 */
class WorkingDayFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'day' => $this->faker->date(),
            'is_active' => $this->faker->boolean(),
            'max_orders' => $this->faker->numberBetween(5, 20),
            'max_time' => $this->faker->numberBetween(30, 120), // minuti limite per modifiche
            'location' => $this->faker->randomElement(['Engineering Hub', 'Main Campus', 'Downtown Office']),
            'start_time' => $this->faker->time('H:i'),
            'end_time' => $this->faker->time('H:i'),
        ];
    }
}
