<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientAvailability;
use App\Models\WorkingDay;
use Illuminate\Support\Collection;

class IngredientAvailabilityService
{
    /**
     * @return Collection<int, array{ingredient: Ingredient, available: bool, override_available: bool|null}>
     */
    public function ingredientsWithEffectiveAvailability(?WorkingDay $workingDay = null): Collection
    {
        $ingredients = Ingredient::orderBy('category')
            ->orderBy('name')
            ->get();

        $overrides = collect();
        if ($workingDay) {
            $overrides = IngredientAvailability::where('working_day_id', $workingDay->id)
                ->get()
                ->keyBy('ingredient_id');
        }

        return $ingredients->map(function (Ingredient $ingredient) use ($overrides) {
            $override = $overrides->get($ingredient->id);

            return [
                'ingredient' => $ingredient,
                'available' => $override ? (bool) $override->is_available : (bool) $ingredient->is_available,
                'override_available' => $override ? (bool) $override->is_available : null,
            ];
        });
    }

    public function isIngredientAvailableForWorkingDay(Ingredient $ingredient, WorkingDay $workingDay): bool
    {
        $override = IngredientAvailability::where('ingredient_id', $ingredient->id)
            ->where('working_day_id', $workingDay->id)
            ->first();

        return $override ? (bool) $override->is_available : (bool) $ingredient->is_available;
    }

    /**
     * @param array<int> $ingredientIds
     * @return Collection<int, Ingredient>
     */
    public function unavailableIngredientsForWorkingDay(array $ingredientIds, WorkingDay $workingDay): Collection
    {
        $ingredients = Ingredient::whereIn('id', $ingredientIds)->get();

        return $ingredients->filter(function (Ingredient $ingredient) use ($workingDay) {
            return !$this->isIngredientAvailableForWorkingDay($ingredient, $workingDay);
        })->values();
    }
}
