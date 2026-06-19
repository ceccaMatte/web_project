<?php

namespace Tests\Feature;

use App\Models\Ingredient;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\WorkingDay;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_block_and_unblock_customer(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->user()->create(['enabled' => true]);

        $this->actingAs($admin)
            ->get('/admin/users')
            ->assertOk()
            ->assertViewIs('pages.admin-users');

        $this->actingAs($admin)
            ->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $user->id,
                'enabled' => true,
            ]);

        $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$user->id}/enabled", ['enabled' => false])
            ->assertOk()
            ->assertJsonPath('user.enabled', false);

        $this->assertFalse($user->fresh()->enabled);

        $this->actingAs($admin)
            ->patchJson("/api/admin/users/{$user->id}/enabled", ['enabled' => true])
            ->assertOk()
            ->assertJsonPath('user.enabled', true);

        $this->assertTrue($user->fresh()->enabled);
    }

    public function test_blocked_user_cannot_create_new_orders(): void
    {
        $user = User::factory()->user()->create(['enabled' => false]);
        $workingDay = WorkingDay::factory()->create([
            'day' => now()->addDay()->toDateString(),
            'is_active' => true,
            'max_orders' => 10,
        ]);
        $slot = TimeSlot::factory()->create(['working_day_id' => $workingDay->id]);
        $bread = Ingredient::create([
            'name' => 'Ciabatta',
            'code' => 'BRD_TEST',
            'category' => 'bread',
            'is_available' => true,
        ]);

        $this->actingAs($user)
            ->get('/orders/create')
            ->assertForbidden();

        $this->actingAs($user)
            ->postJson('/orders', [
                'time_slot_id' => $slot->id,
                'ingredients' => [$bread->id],
            ])
            ->assertForbidden()
            ->assertJson([
                'code' => 'USER_DISABLED',
            ]);

        $this->assertDatabaseCount('orders', 0);
    }
}
