<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WorkingDay;
use App\Services\SchedulerService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchedulerServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_scheduler_defaults_to_today_and_never_to_a_past_active_day(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-20 12:00:00'));

        WorkingDay::factory()->create([
            'day' => '2026-06-15',
            'is_active' => true,
        ]);

        $scheduler = app(SchedulerService::class)->buildWeekScheduler();
        $daysById = collect($scheduler['weekDays'])->keyBy('id');

        $this->assertSame('2026-06-20', $scheduler['selectedDayId']);
        $this->assertFalse($daysById['2026-06-15']['isSelected']);
        $this->assertTrue($daysById['2026-06-15']['isDisabled']);
        $this->assertTrue($daysById['2026-06-20']['isToday']);
        $this->assertTrue($daysById['2026-06-20']['isSelected']);
        $this->assertFalse($daysById['2026-06-20']['isDisabled']);
        $this->assertCount(1, collect($scheduler['weekDays'])->where('isToday', true));
        $this->assertCount(1, collect($scheduler['weekDays'])->where('isSelected', true));
    }

    public function test_scheduler_can_select_future_day_without_service(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-20 12:00:00'));

        $scheduler = app(SchedulerService::class)->buildWeekScheduler('2026-06-21');
        $selectedDay = collect($scheduler['weekDays'])->firstWhere('id', '2026-06-21');

        $this->assertSame('2026-06-21', $scheduler['selectedDayId']);
        $this->assertTrue($selectedDay['isSelected']);
        $this->assertFalse($selectedDay['isActive']);
        $this->assertFalse($selectedDay['isDisabled']);
    }

    public function test_scheduler_dates_are_consistent_in_home_orders_and_create_order_apis(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-20 12:00:00'));

        $user = User::factory()->create();

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('scheduler.selectedDayId', '2026-06-20');

        $this->actingAs($user)
            ->getJson('/api/orders/init')
            ->assertOk()
            ->assertJsonPath('scheduler.selectedDayId', '2026-06-20');

        $this->actingAs($user)
            ->getJson('/api/orders/form/create?date=2026-06-21')
            ->assertOk()
            ->assertJsonPath('scheduler.selectedDayId', '2026-06-21')
            ->assertJsonPath('selectedDate', '2026-06-21');
    }
}
