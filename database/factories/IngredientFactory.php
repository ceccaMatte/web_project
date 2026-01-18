<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ingredient>
 */
class IngredientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->word(),
            'code' => strtoupper($this->faker->unique()->lexify('???')),
            'category' => $this->faker->randomElement(['bread', 'meat', 'cheese', 'vegetable', 'sauce', 'other']),
            'is_available' => true,
        ];
    }

    /**
     * Indicate that the ingredient is bread.
     */
    public function bread(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'bread',
        ]);
    }

    /**
     * Indicate that the ingredient is meat.
     */
    public function meat(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'meat',
        ]);
    }

    /**
     * Indicate that the ingredient is cheese.
     */
    public function cheese(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => 'cheese',
        ]);
    }

    /**
     * Indicate that the ingredient is unavailable.
     */
    public function unavailable(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available' => false,
        ]);
    }
}
