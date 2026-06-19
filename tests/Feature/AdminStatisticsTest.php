<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderIngredient;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\WorkingDay;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminStatisticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_statistics_api_returns_expected_aggregates(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->user()->create(['nickname' => 'Mario']);
        $workingDay = WorkingDay::factory()->create(['day' => '2026-02-10']);
        $slot = TimeSlot::factory()->create([
            'working_day_id' => $workingDay->id,
            'start_time' => '12:00',
            'end_time' => '12:15',
        ]);

        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'working_day_id' => $workingDay->id,
            'time_slot_id' => $slot->id,
            'status' => 'picked_up',
            'daily_number' => 1,
            'created_at' => '2026-02-10 09:00:00',
        ]);
        OrderIngredient::create([
            'order_id' => $order->id,
            'name' => 'Ciabatta',
            'category' => 'bread',
        ]);

        Order::factory()->create([
            'user_id' => $customer->id,
            'working_day_id' => $workingDay->id,
            'time_slot_id' => $slot->id,
            'status' => 'rejected',
            'daily_number' => 2,
            'created_at' => '2026-02-10 10:00:00',
        ]);

        $this->actingAs($admin)
            ->get('/admin/statistics')
            ->assertOk()
            ->assertViewIs('pages.admin-statistics');

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/statistics?from=2026-02-01&to=2026-02-28')
            ->assertOk()
            ->assertJsonPath('summary.total_orders', 2)
            ->assertJsonPath('summary.rejected_orders', 1)
            ->assertJsonPath('summary.unique_customers', 1);

        $this->assertEquals('2026-02-10', $response->json('daily_trend.0.date'));
        $this->assertEquals('Ciabatta', $response->json('popular_ingredients.0.name'));
        $this->assertEquals('Mario', $response->json('top_customers.0.nickname'));
    }
}
