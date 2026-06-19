<?php

namespace Tests\Feature;

use App\Models\Ingredient;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\WorkingDay;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminIngredientManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_ingredients_and_daily_availability(): void
    {
        $admin = User::factory()->admin()->create();
        $workingDay = WorkingDay::factory()->create(['day' => '2026-02-01']);
        $ingredient = Ingredient::create([
            'name' => 'Mozzarella',
            'code' => 'CHEESE_MOZ_TEST',
            'category' => 'cheese',
            'is_available' => true,
        ]);

        $this->actingAs($admin)
            ->get('/admin/ingredients')
            ->assertOk()
            ->assertViewIs('pages.admin-ingredients');

        $this->actingAs($admin)
            ->postJson('/api/admin/ingredients', [
                'name' => 'Rucola',
                'code' => 'VEG_RUC_TEST',
                'category' => 'vegetable',
                'is_available' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('ingredient.name', 'Rucola');

        $this->actingAs($admin)
            ->patchJson("/api/admin/ingredients/{$ingredient->id}", [
                'name' => 'Mozzarella DOP',
                'code' => 'CHEESE_MOZ_DOP',
                'category' => 'cheese',
                'is_available' => false,
            ])
            ->assertOk()
            ->assertJsonPath('ingredient.name', 'Mozzarella DOP')
            ->assertJsonPath('ingredient.is_available', false);

        $this->actingAs($admin)
            ->patchJson("/api/admin/ingredients/{$ingredient->id}/availability", [
                'working_day_id' => $workingDay->id,
                'is_available' => true,
            ])
            ->assertOk()
            ->assertJsonPath('is_available', true);

        $this->assertDatabaseHas('ingredient_availabilities', [
            'ingredient_id' => $ingredient->id,
            'working_day_id' => $workingDay->id,
            'is_available' => true,
        ]);

        $this->actingAs($admin)
            ->getJson('/api/admin/ingredients?date=2026-02-01')
            ->assertOk()
            ->assertJsonFragment([
                'name' => 'Mozzarella DOP',
                'global_available' => false,
                'daily_available' => true,
                'override_available' => true,
            ]);

        $createdIngredient = Ingredient::where('code', 'VEG_RUC_TEST')->firstOrFail();

        $this->actingAs($admin)
            ->deleteJson("/api/admin/ingredients/{$createdIngredient->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Ingrediente eliminato.');

        $this->assertDatabaseMissing('ingredients', [
            'id' => $createdIngredient->id,
        ]);
    }

    public function test_daily_unavailable_ingredient_cannot_be_ordered(): void
    {
        $user = User::factory()->user()->create();
        $admin = User::factory()->admin()->create();
        $workingDay = WorkingDay::factory()->create([
            'day' => now()->addDay()->toDateString(),
            'is_active' => true,
            'max_orders' => 10,
        ]);
        $slot = TimeSlot::factory()->create(['working_day_id' => $workingDay->id]);

        $bread = Ingredient::create([
            'name' => 'Ciabatta',
            'code' => 'BRD_DAILY',
            'category' => 'bread',
            'is_available' => true,
        ]);
        $meat = Ingredient::create([
            'name' => 'Prosciutto',
            'code' => 'MEAT_DAILY',
            'category' => 'meat',
            'is_available' => true,
        ]);

        $this->actingAs($admin)
            ->patchJson("/api/admin/ingredients/{$meat->id}/availability", [
                'working_day_id' => $workingDay->id,
                'is_available' => false,
            ])
            ->assertOk();

        $this->actingAs($user)
            ->postJson('/orders', [
                'time_slot_id' => $slot->id,
                'ingredients' => [$bread->id, $meat->id],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['ingredients']);

        $this->assertDatabaseCount('orders', 0);
    }
}
