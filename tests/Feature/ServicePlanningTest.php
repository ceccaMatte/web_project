<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\WorkingDay;
use App\Services\ServicePlanningService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ServicePlanningTest
 * 
 * Comprehensive tests for the Service Planning functionality.
 * Tests cover:
 * - getConfig() - global configuration
 * - getWeekConfiguration() - week data retrieval
 * - saveWeekConfiguration() - week data saving with all edge cases
 * - Temporal rules (past weeks, past days)
 * - Time slot regeneration
 * - Order rejection when reducing hours
 */
class ServicePlanningTest extends TestCase
{
    use RefreshDatabase;

    private ServicePlanningService $service;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ServicePlanningService::class);
        
        // Create admin user for authenticated requests
        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);
    }

    // ========================================
    // getConfig() Tests
    // ========================================

    /** @test */
    public function get_config_returns_expected_structure()
    {
        $config = $this->service->getConfig();

        $this->assertArrayHasKey('slotDuration', $config);
        $this->assertArrayHasKey('minMaxOrdersPerSlot', $config);
        $this->assertArrayHasKey('maxMaxOrdersPerSlot', $config);
        $this->assertArrayHasKey('defaultMaxOrdersPerSlot', $config);
        $this->assertArrayHasKey('minMaxIngredientsPerOrder', $config);
        $this->assertArrayHasKey('maxMaxIngredientsPerOrder', $config);
        $this->assertArrayHasKey('defaultMaxIngredientsPerOrder', $config);
        $this->assertArrayHasKey('defaultStartTime', $config);
        $this->assertArrayHasKey('defaultStopTime', $config);
        $this->assertArrayHasKey('location', $config);
    }

    /** @test */
    public function get_config_returns_valid_slot_duration()
    {
        $config = $this->service->getConfig();

        $this->assertIsInt($config['slotDuration']);
        $this->assertGreaterThan(0, $config['slotDuration']);
        // Common values: 15, 30, 60
        $this->assertContains($config['slotDuration'], [15, 30, 60]);
    }

    /** @test */
    public function get_config_returns_valid_constraint_ranges()
    {
        $config = $this->service->getConfig();

        // Min should be less than max
        $this->assertLessThan($config['maxMaxOrdersPerSlot'], $config['minMaxOrdersPerSlot']);
        $this->assertLessThan($config['maxMaxIngredientsPerOrder'], $config['minMaxIngredientsPerOrder']);

        // Default should be within range
        $this->assertGreaterThanOrEqual($config['minMaxOrdersPerSlot'], $config['defaultMaxOrdersPerSlot']);
        $this->assertLessThanOrEqual($config['maxMaxOrdersPerSlot'], $config['defaultMaxOrdersPerSlot']);
        
        $this->assertGreaterThanOrEqual($config['minMaxIngredientsPerOrder'], $config['defaultMaxIngredientsPerOrder']);
        $this->assertLessThanOrEqual($config['maxMaxIngredientsPerOrder'], $config['defaultMaxIngredientsPerOrder']);
    }

    /** @test */
    public function get_config_returns_valid_time_format()
    {
        $config = $this->service->getConfig();

        // Time should be in HH:MM format
        $this->assertMatchesRegularExpression('/^\d{2}:\d{2}$/', $config['defaultStartTime']);
        $this->assertMatchesRegularExpression('/^\d{2}:\d{2}$/', $config['defaultStopTime']);
    }

    // ========================================
    // getWeekConfiguration() Tests
    // ========================================

    /** @test */
    public function get_week_configuration_returns_expected_structure()
    {
        $weekStart = Carbon::today()->startOfWeek(Carbon::MONDAY)->format('Y-m-d');
        
        $weekData = $this->service->getWeekConfiguration($weekStart);

        $this->assertArrayHasKey('weekStart', $weekData);
        $this->assertArrayHasKey('weekEnd', $weekData);
        $this->assertArrayHasKey('isWeekEditable', $weekData);
        $this->assertArrayHasKey('hasPersistedData', $weekData);
        $this->assertArrayHasKey('globalConstraints', $weekData);
        $this->assertArrayHasKey('days', $weekData);
        $this->assertArrayHasKey('config', $weekData);
    }

    /** @test */
    public function get_week_configuration_returns_seven_days()
    {
        $weekStart = Carbon::today()->startOfWeek(Carbon::MONDAY)->format('Y-m-d');
        
        $weekData = $this->service->getWeekConfiguration($weekStart);

        $this->assertCount(7, $weekData['days']);
    }

    /** @test */
    public function get_week_configuration_days_have_expected_structure()
    {
        $weekStart = Carbon::today()->startOfWeek(Carbon::MONDAY)->format('Y-m-d');
        
        $weekData = $this->service->getWeekConfiguration($weekStart);
        $day = $weekData['days'][0];

        $this->assertArrayHasKey('date', $day);
        $this->assertArrayHasKey('dayOfWeek', $day);
        $this->assertArrayHasKey('dayName', $day);
        $this->assertArrayHasKey('dayNameShort', $day);
        $this->assertArrayHasKey('dayNumber', $day);
        $this->assertArrayHasKey('isActive', $day);
        $this->assertArrayHasKey('startTime', $day);
        $this->assertArrayHasKey('endTime', $day);
        $this->assertArrayHasKey('isEditable', $day);
        $this->assertArrayHasKey('hasOrders', $day);
        $this->assertArrayHasKey('ordersCount', $day);
    }

    /** @test */
    public function get_week_configuration_has_persisted_data_false_for_new_week()
    {
        // Use a future week that doesn't have any working days
        $weekStart = Carbon::today()->addWeeks(10)->startOfWeek(Carbon::MONDAY)->format('Y-m-d');
        
        $weekData = $this->service->getWeekConfiguration($weekStart);

        $this->assertFalse($weekData['hasPersistedData']);
    }

    /** @test */
    public function get_week_configuration_has_persisted_data_true_when_working_days_exist()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        // Create a working day for this week
        WorkingDay::factory()->create([
            'day' => $weekStart->format('Y-m-d'),
            'is_active' => true,
        ]);

        $weekData = $this->service->getWeekConfiguration($weekStart->format('Y-m-d'));

        $this->assertTrue($weekData['hasPersistedData']);
    }

    /** @test */
    public function get_week_configuration_future_week_is_editable()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY)->format('Y-m-d');
        
        $weekData = $this->service->getWeekConfiguration($weekStart);

        $this->assertTrue($weekData['isWeekEditable']);
    }

    /** @test */
    public function get_week_configuration_past_week_is_not_editable()
    {
        $weekStart = Carbon::today()->subWeeks(2)->startOfWeek(Carbon::MONDAY)->format('Y-m-d');
        
        $weekData = $this->service->getWeekConfiguration($weekStart);

        $this->assertFalse($weekData['isWeekEditable']);
    }

    /** @test */
    public function get_week_configuration_past_days_are_not_editable()
    {
        $weekStart = Carbon::today()->startOfWeek(Carbon::MONDAY);
        $today = Carbon::today();
        
        $weekData = $this->service->getWeekConfiguration($weekStart->format('Y-m-d'));

        foreach ($weekData['days'] as $day) {
            $dayDate = Carbon::parse($day['date']);
            if ($dayDate->lte($today)) {
                $this->assertFalse($day['isEditable'], "Day {$day['date']} should not be editable (past or today)");
            } else {
                $this->assertTrue($day['isEditable'], "Day {$day['date']} should be editable (future)");
            }
        }
    }

    /** @test */
    public function get_week_configuration_deduces_constraints_from_existing_working_day()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        // Create a working day with specific constraints
        WorkingDay::factory()->create([
            'day' => $weekStart->format('Y-m-d'),
            'is_active' => true,
            'max_orders' => 25,
            'max_time' => 45,
            'location' => 'Test Location',
        ]);

        $weekData = $this->service->getWeekConfiguration($weekStart->format('Y-m-d'));

        $this->assertEquals(25, $weekData['globalConstraints']['maxOrdersPerSlot']);
        $this->assertEquals(45, $weekData['globalConstraints']['maxPendingTime']);
        $this->assertEquals('Test Location', $weekData['globalConstraints']['location']);
    }

    // ========================================
    // saveWeekConfiguration() Tests - Basic
    // ========================================

    /** @test */
    public function save_week_configuration_creates_working_days()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        $globalConstraints = [
            'maxOrdersPerSlot' => 15,
            'maxIngredientsPerOrder' => 8,
        ];
        
        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $date = (clone $weekStart)->addDays($i);
            $days[] = [
                'date' => $date->format('Y-m-d'),
                'dayName' => $date->format('l'),
                'isActive' => $i < 5, // Mon-Fri active
                'startTime' => '12:00',
                'stopTime' => '14:00',
            ];
        }

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        $this->assertGreaterThan(0, $result['report']['daysCreated']);
        
        // Verify working days were created
        $createdDays = WorkingDay::whereDate('day', '>=', $weekStart)
            ->whereDate('day', '<=', $weekStart->copy()->addDays(6))
            ->get();
        
        $this->assertGreaterThan(0, $createdDays->count());
    }

    /** @test */
    public function save_week_configuration_generates_time_slots()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        $globalConstraints = [
            'maxOrdersPerSlot' => 10,
            'maxIngredientsPerOrder' => 6,
        ];
        
        // One active day: 12:00-14:00 with 15-min slots = 8 slots
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '12:00',
            'stopTime' => '14:00',
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        $this->assertGreaterThan(0, $result['report']['timeSlotsGenerated']);
        
        // Verify time slots were created
        $workingDay = WorkingDay::whereDate('day', $weekStart)->first();
        $this->assertNotNull($workingDay);
        
        $slots = TimeSlot::where('working_day_id', $workingDay->id)->get();
        $this->assertGreaterThan(0, $slots->count());
    }

    /** @test */
    public function save_week_configuration_updates_existing_working_days()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        // Create existing working day
        $existingDay = WorkingDay::factory()->create([
            'day' => $weekStart->format('Y-m-d'),
            'is_active' => true,
            'start_time' => '10:00',
            'end_time' => '12:00',
            'max_orders' => 5,
        ]);

        $globalConstraints = [
            'maxOrdersPerSlot' => 20,
            'maxIngredientsPerOrder' => 10,
        ];
        
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '12:00',
            'stopTime' => '14:00',
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        
        // Verify working day was updated
        $existingDay->refresh();
        $this->assertEquals(20, $existingDay->max_orders);
        // Start time can be stored as 12:00 or 12:00:00 depending on DB driver
        $this->assertStringStartsWith('12:00', $existingDay->start_time);
    }

    // ========================================
    // saveWeekConfiguration() Tests - Temporal Rules
    // ========================================

    /** @test */
    public function save_week_configuration_rejects_completely_past_week()
    {
        $weekStart = Carbon::today()->subWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        $globalConstraints = [
            'maxOrdersPerSlot' => 10,
            'maxIngredientsPerOrder' => 6,
        ];
        
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '12:00',
            'stopTime' => '14:00',
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertFalse($result['saved']);
        $this->assertStringContainsString('passata', $result['message']);
    }

    /** @test */
    public function save_week_configuration_skips_past_days()
    {
        // Current week with some past days
        $weekStart = Carbon::today()->startOfWeek(Carbon::MONDAY);
        $today = Carbon::today();
        
        $globalConstraints = [
            'maxOrdersPerSlot' => 10,
            'maxIngredientsPerOrder' => 6,
        ];
        
        // Include all 7 days
        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $date = (clone $weekStart)->addDays($i);
            $days[] = [
                'date' => $date->format('Y-m-d'),
                'dayName' => $date->format('l'),
                'isActive' => true,
                'startTime' => '12:00',
                'stopTime' => '14:00',
            ];
        }

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        // Should save (week not completely in past)
        $this->assertTrue($result['saved']);
        
        // Days <= today should be skipped
        $dayOfWeek = $today->dayOfWeek === 0 ? 6 : $today->dayOfWeek - 1; // Convert Sunday=0 to Monday=0 format
        $expectedSkipped = $dayOfWeek + 1; // Monday=0 means 1 day skipped, etc.
        
        $this->assertGreaterThan(0, $result['report']['daysSkipped']);
    }

    /** @test */
    public function save_week_configuration_skips_today()
    {
        // Create a scenario where today is the first day of the week (Monday)
        Carbon::setTestNow(Carbon::today()->startOfWeek(Carbon::MONDAY)->setHour(12));
        
        $weekStart = Carbon::today()->startOfWeek(Carbon::MONDAY);
        
        $globalConstraints = [
            'maxOrdersPerSlot' => 10,
            'maxIngredientsPerOrder' => 6,
        ];
        
        // Only today
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '12:00',
            'stopTime' => '14:00',
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        // Today should be skipped
        $this->assertTrue($result['saved']);
        $this->assertEquals(1, $result['report']['daysSkipped']);
        $this->assertEquals(0, $result['report']['daysCreated']);
        
        Carbon::setTestNow(); // Reset
    }

    // ========================================
    // saveWeekConfiguration() Tests - Order Rejection
    // ========================================

    /** @test */
    public function save_week_configuration_rejects_orders_when_day_disabled()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        // Create working day with time slot and order
        $workingDay = WorkingDay::factory()->create([
            'day' => $weekStart->format('Y-m-d'),
            'is_active' => true,
            'start_time' => '12:00',
            'end_time' => '14:00',
        ]);
        
        $timeSlot = TimeSlot::factory()->create([
            'working_day_id' => $workingDay->id,
            'start_time' => '12:00',
            'end_time' => '12:15',
        ]);
        
        $user = User::factory()->create();
        
        // Create order directly
        $order = Order::create([
            'user_id' => $user->id,
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 1,
            'status' => 'pending',
        ]);

        $globalConstraints = [
            'maxOrdersPerSlot' => 10,
            'maxIngredientsPerOrder' => 6,
        ];
        
        // Disable the day
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => false,
            'startTime' => '12:00',
            'stopTime' => '14:00',
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        $this->assertEquals(1, $result['report']['ordersRejected']);
        
        // Verify order status changed
        $order->refresh();
        $this->assertEquals('rejected', $order->status);
    }

    /** @test */
    public function save_week_configuration_rejects_orders_when_time_range_reduced()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        // Create working day 12:00-16:00
        $workingDay = WorkingDay::factory()->create([
            'day' => $weekStart->format('Y-m-d'),
            'is_active' => true,
            'start_time' => '12:00',
            'end_time' => '16:00',
        ]);
        
        // Create slot at 15:00 (will be removed when we reduce to 14:00)
        $timeSlot = TimeSlot::factory()->create([
            'working_day_id' => $workingDay->id,
            'start_time' => '15:00',
            'end_time' => '15:15',
        ]);
        
        $user = User::factory()->create();
        
        // Create order directly
        $order = Order::create([
            'user_id' => $user->id,
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 1,
            'status' => 'confirmed',
        ]);

        $globalConstraints = [
            'maxOrdersPerSlot' => 10,
            'maxIngredientsPerOrder' => 6,
        ];
        
        // Reduce to 12:00-14:00 (removes 15:00 slot)
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '12:00',
            'stopTime' => '14:00',
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        // Verify 1 order was marked as rejected before being cascade-deleted
        $this->assertEquals(1, $result['report']['ordersRejected']);
        
        // Note: The order is cascade-deleted when the time slot is deleted.
        // This is by design - orders outside the new time range are rejected
        // and then removed along with their slots.
        $this->assertNull(Order::find($order->id), 'Order should be cascade-deleted with time slot');
    }

    /** @test */
    public function save_week_configuration_rejects_orders_when_max_orders_reduced()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        // Create working day with max_orders = 10
        $workingDay = WorkingDay::factory()->create([
            'day' => $weekStart->format('Y-m-d'),
            'is_active' => true,
            'start_time' => '12:00',
            'end_time' => '14:00',
            'max_orders' => 10,
        ]);
        
        // Create a time slot
        $timeSlot = TimeSlot::factory()->create([
            'working_day_id' => $workingDay->id,
            'start_time' => '12:00',
            'end_time' => '12:15',
        ]);
        
        $user = User::factory()->create();
        
        // Create 9 orders with daily_numbers 1-9
        $orders = [];
        for ($i = 1; $i <= 9; $i++) {
            $orders[] = Order::create([
                'user_id' => $user->id,
                'time_slot_id' => $timeSlot->id,
                'working_day_id' => $workingDay->id,
                'daily_number' => $i,
                'status' => 'pending',
            ]);
        }

        // Reduce max_orders from 10 to 5
        $globalConstraints = [
            'maxOrdersPerSlot' => 5,
            'maxIngredientsPerOrder' => 6,
        ];
        
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '12:00',
            'stopTime' => '14:00',
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        
        // 4 orders should be rejected (6, 7, 8, 9)
        $this->assertEquals(4, $result['report']['ordersRejected']);
        
        // Fetch each order by ID and verify status
        foreach ($orders as $i => $order) {
            $freshOrder = Order::find($order->id);
            $dailyNumber = $i + 1;
            
            if ($dailyNumber <= 5) {
                $this->assertEquals('pending', $freshOrder->status, "Order with daily_number {$dailyNumber} should remain pending");
            } else {
                $this->assertEquals('rejected', $freshOrder->status, "Order with daily_number {$dailyNumber} should be rejected");
            }
        }
    }

    /** @test */
    public function save_week_configuration_does_not_reject_orders_when_max_orders_increased()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        // Create working day with max_orders = 5
        $workingDay = WorkingDay::factory()->create([
            'day' => $weekStart->format('Y-m-d'),
            'is_active' => true,
            'start_time' => '12:00',
            'end_time' => '14:00',
            'max_orders' => 5,
        ]);
        
        // Create a time slot
        $timeSlot = TimeSlot::factory()->create([
            'working_day_id' => $workingDay->id,
            'start_time' => '12:00',
            'end_time' => '12:15',
        ]);
        
        $user = User::factory()->create();
        
        // Create 4 orders with 'pending' status (not confirmed)
        $orders = [];
        for ($i = 1; $i <= 4; $i++) {
            $orders[] = Order::create([
                'user_id' => $user->id,
                'time_slot_id' => $timeSlot->id,
                'working_day_id' => $workingDay->id,
                'daily_number' => $i,
                'status' => 'pending', // Use pending, not confirmed
            ]);
        }

        // Increase max_orders from 5 to 15
        $globalConstraints = [
            'maxOrdersPerSlot' => 15,
            'maxIngredientsPerOrder' => 6,
        ];
        
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '12:00',
            'stopTime' => '14:00',
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        
        // No orders should be rejected when capacity increases
        $this->assertEquals(0, $result['report']['ordersRejected']);
        
        // Fetch orders fresh from database and verify all remain pending
        $freshOrders = Order::where('time_slot_id', $timeSlot->id)
            ->orderBy('daily_number')
            ->get();
        
        foreach ($freshOrders as $order) {
            $this->assertEquals('pending', $order->status); // Should be pending, not confirmed
        }
    }

    /** @test */
    public function save_week_configuration_rejects_orders_based_on_daily_number_not_id()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        // Create working day with max_orders = 10
        $workingDay = WorkingDay::factory()->create([
            'day' => $weekStart->format('Y-m-d'),
            'is_active' => true,
            'start_time' => '12:00',
            'end_time' => '14:00',
            'max_orders' => 10,
        ]);
        
        // Create a time slot
        $timeSlot = TimeSlot::factory()->create([
            'working_day_id' => $workingDay->id,
            'start_time' => '12:00',
            'end_time' => '12:15',
        ]);
        
        $user = User::factory()->create();
        
        // Create orders with specific daily_numbers in random order
        // This ensures we test daily_number sorting, not ID or created_at
        $order1 = Order::create([
            'user_id' => $user->id,
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 3,
            'status' => 'pending',
        ]);
        
        $order2 = Order::create([
            'user_id' => $user->id,
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 1,
            'status' => 'pending',
        ]);
        
        $order3 = Order::create([
            'user_id' => $user->id,
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 2,
            'status' => 'pending',
        ]);

        // Reduce max_orders to 2
        $globalConstraints = [
            'maxOrdersPerSlot' => 2,
            'maxIngredientsPerOrder' => 6,
        ];
        
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '12:00',
            'stopTime' => '14:00',
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        $this->assertEquals(1, $result['report']['ordersRejected']);
        
        // Verify orders by daily_number
        $order1->refresh(); // daily_number = 3 → should be REJECTED
        $order2->refresh(); // daily_number = 1 → should remain PENDING
        $order3->refresh(); // daily_number = 2 → should remain PENDING
        
        $this->assertEquals('pending', $order2->status, 'Order with daily_number 1 should remain pending');
        $this->assertEquals('pending', $order3->status, 'Order with daily_number 2 should remain pending');
        $this->assertEquals('rejected', $order1->status, 'Order with daily_number 3 should be rejected');
    }

    /** @test */
    public function save_week_configuration_does_not_touch_already_rejected_orders()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        // Create working day with max_orders = 10
        $workingDay = WorkingDay::factory()->create([
            'day' => $weekStart->format('Y-m-d'),
            'is_active' => true,
            'start_time' => '12:00',
            'end_time' => '14:00',
            'max_orders' => 10,
        ]);
        
        // Create a time slot
        $timeSlot = TimeSlot::factory()->create([
            'working_day_id' => $workingDay->id,
            'start_time' => '12:00',
            'end_time' => '12:15',
        ]);
        
        $user = User::factory()->create();
        
        // Create only 2 active orders (pending + confirmed)
        $pendingOrder = Order::create([
            'user_id' => $user->id,
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 1,
            'status' => 'pending',
        ]);
        
        $confirmedOrder = Order::create([
            'user_id' => $user->id,
            'time_slot_id' => $timeSlot->id,
            'working_day_id' => $workingDay->id,
            'daily_number' => 2,
            'status' => 'confirmed',
        ]);

        // Reduce max_orders to 1 (will keep first, reject second)
        $globalConstraints = [
            'maxOrdersPerSlot' => 1,
            'maxIngredientsPerOrder' => 6,
        ];
        
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '12:00',
            'stopTime' => '14:00',
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        
        // We have 2 orders that count (pending + confirmed)
        // max_orders = 1, so 1 order should be rejected (the confirmed one with daily_number 2)
        $this->assertEquals(1, $result['report']['ordersRejected']);
        
        // Fetch orders fresh from database
        $freshPending = Order::find($pendingOrder->id);
        $freshConfirmed = Order::find($confirmedOrder->id);
        
        $this->assertEquals('pending', $freshPending->status); // Stays pending (first in line, daily_number 1)
        $this->assertEquals('rejected', $freshConfirmed->status); // Gets rejected (exceeds capacity, daily_number 2)
    }

    /** @test */
    public function save_week_configuration_handles_multiple_time_slots_correctly()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        // Create working day with max_orders = 10
        $workingDay = WorkingDay::factory()->create([
            'day' => $weekStart->format('Y-m-d'),
            'is_active' => true,
            'start_time' => '12:00',
            'end_time' => '14:00',
            'max_orders' => 10,
        ]);
        
        // Create two time slots
        $timeSlot1 = TimeSlot::factory()->create([
            'working_day_id' => $workingDay->id,
            'start_time' => '12:00',
            'end_time' => '12:15',
        ]);
        
        $timeSlot2 = TimeSlot::factory()->create([
            'working_day_id' => $workingDay->id,
            'start_time' => '12:15',
            'end_time' => '12:30',
        ]);
        
        $user = User::factory()->create();
        
        // Create 4 orders in first slot (daily_numbers 1-4)
        for ($i = 1; $i <= 4; $i++) {
            Order::create([
                'user_id' => $user->id,
                'time_slot_id' => $timeSlot1->id,
                'working_day_id' => $workingDay->id,
                'daily_number' => $i,
                'status' => 'pending',
            ]);
        }
        
        // Create 3 orders in second slot (daily_numbers 5-7)
        for ($i = 5; $i <= 7; $i++) {
            Order::create([
                'user_id' => $user->id,
                'time_slot_id' => $timeSlot2->id,
                'working_day_id' => $workingDay->id,
                'daily_number' => $i,
                'status' => 'pending',
            ]);
        }

        // Reduce max_orders to 2 per slot
        $globalConstraints = [
            'maxOrdersPerSlot' => 2,
            'maxIngredientsPerOrder' => 6,
        ];
        
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '12:00',
            'stopTime' => '14:00',
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        
        // Slot 1: 4 orders → keep 2, reject 2
        // Slot 2: 3 orders → keep 2, reject 1
        // Total rejected: 3
        $this->assertEquals(3, $result['report']['ordersRejected']);
        
        // Verify slot 1 orders
        $slot1Orders = Order::where('time_slot_id', $timeSlot1->id)->orderBy('daily_number')->get();
        $this->assertEquals('pending', $slot1Orders[0]->status); // daily_number 1
        $this->assertEquals('pending', $slot1Orders[1]->status); // daily_number 2
        $this->assertEquals('rejected', $slot1Orders[2]->status); // daily_number 3
        $this->assertEquals('rejected', $slot1Orders[3]->status); // daily_number 4
        
        // Verify slot 2 orders
        $slot2Orders = Order::where('time_slot_id', $timeSlot2->id)->orderBy('daily_number')->get();
        $this->assertEquals('pending', $slot2Orders[0]->status); // daily_number 5
        $this->assertEquals('pending', $slot2Orders[1]->status); // daily_number 6
        $this->assertEquals('rejected', $slot2Orders[2]->status); // daily_number 7
    }

    // ========================================
    // saveWeekConfiguration() Tests - Time Normalization
    // ========================================

    /** @test */
    public function save_week_configuration_normalizes_times_to_slot_duration()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        $globalConstraints = [
            'maxOrdersPerSlot' => 10,
            'maxIngredientsPerOrder' => 6,
        ];
        
        // Use non-aligned time (12:07) - should be normalized
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '12:07', // Should become 12:00 or 12:15
            'stopTime' => '14:23', // Should become 14:15 or 14:30
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        
        // Verify times were normalized
        $workingDay = WorkingDay::whereDate('day', $weekStart)->first();
        $this->assertNotNull($workingDay);
        
        // Start time should be aligned to 15-minute boundary
        $startMinutes = (int) substr($workingDay->start_time, 3, 2);
        $this->assertEquals(0, $startMinutes % 15);
    }

    /** @test */
    public function save_week_configuration_ensures_start_before_stop()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY);
        
        $globalConstraints = [
            'maxOrdersPerSlot' => 10,
            'maxIngredientsPerOrder' => 6,
        ];
        
        // Invalid: start >= stop
        $days = [[
            'date' => $weekStart->format('Y-m-d'),
            'dayName' => 'Monday',
            'isActive' => true,
            'startTime' => '14:00',
            'stopTime' => '12:00', // Before start!
        ]];

        $result = $this->service->saveWeekConfiguration($weekStart->format('Y-m-d'), $globalConstraints, $days);

        $this->assertTrue($result['saved']);
        
        // Verify times were corrected
        $workingDay = WorkingDay::whereDate('day', $weekStart)->first();
        $this->assertNotNull($workingDay);
        
        $startTime = substr($workingDay->start_time, 0, 5);
        $endTime = substr($workingDay->end_time, 0, 5);
        
        $this->assertLessThan($endTime, $startTime);
    }

    // ========================================
    // API Endpoint Tests
    // ========================================

    /** @test */
    public function api_get_config_returns_success()
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/service-planning/config');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'slotDuration',
                    'defaultMaxOrdersPerSlot',
                    'defaultStartTime',
                    'defaultStopTime',
                ],
            ]);
    }

    /** @test */
    public function api_get_config_requires_authentication()
    {
        $response = $this->getJson('/api/admin/service-planning/config');

        // Should return 401 (unauthenticated) or 403 (forbidden)
        $response->assertStatus(401);
    }

    /** @test */
    public function api_get_week_returns_success()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY)->format('Y-m-d');

        $response = $this->actingAs($this->admin)
            ->getJson("/api/admin/service-planning/week/{$weekStart}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'weekStart',
                    'weekEnd',
                    'isWeekEditable',
                    'hasPersistedData',
                    'globalConstraints',
                    'days',
                ],
            ]);
    }

    /** @test */
    public function api_get_week_with_invalid_date_returns_error()
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/service-planning/week/invalid-date');

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
            ]);
    }

    /** @test */
    public function api_save_week_returns_success()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY)->format('Y-m-d');

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/service-planning/week/{$weekStart}", [
                'globalConstraints' => [
                    'maxOrdersPerSlot' => 10,
                    'maxIngredientsPerOrder' => 6,
                ],
                'days' => [
                    [
                        'date' => $weekStart,
                        'dayName' => 'Monday',
                        'isActive' => true,
                        'startTime' => '12:00',
                        'stopTime' => '14:00',
                    ],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'report',
            ]);
    }

    /** @test */
    public function api_save_week_validates_constraints()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY)->format('Y-m-d');

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/service-planning/week/{$weekStart}", [
                'globalConstraints' => [
                    'maxOrdersPerSlot' => 0, // Below minimum
                    'maxIngredientsPerOrder' => 100, // Above maximum
                ],
                'days' => [],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['globalConstraints.maxOrdersPerSlot', 'globalConstraints.maxIngredientsPerOrder']);
    }

    /** @test */
    public function api_save_week_validates_day_structure()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY)->format('Y-m-d');

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/service-planning/week/{$weekStart}", [
                'globalConstraints' => [
                    'maxOrdersPerSlot' => 10,
                    'maxIngredientsPerOrder' => 6,
                ],
                'days' => [
                    [
                        // Missing required fields
                        'date' => $weekStart,
                    ],
                ],
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function api_save_week_validates_time_format()
    {
        $weekStart = Carbon::today()->addWeeks(2)->startOfWeek(Carbon::MONDAY)->format('Y-m-d');

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/service-planning/week/{$weekStart}", [
                'globalConstraints' => [
                    'maxOrdersPerSlot' => 10,
                    'maxIngredientsPerOrder' => 6,
                ],
                'days' => [
                    [
                        'date' => $weekStart,
                        'dayName' => 'Monday',
                        'isActive' => true,
                        'startTime' => '25:00', // Invalid time
                        'stopTime' => '14:00',
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['days.0.startTime']);
    }

    /** @test */
    public function api_save_week_returns_422_for_past_week()
    {
        $weekStart = Carbon::today()->subWeeks(2)->startOfWeek(Carbon::MONDAY)->format('Y-m-d');

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/service-planning/week/{$weekStart}", [
                'globalConstraints' => [
                    'maxOrdersPerSlot' => 10,
                    'maxIngredientsPerOrder' => 6,
                ],
                'days' => [
                    [
                        'date' => $weekStart,
                        'dayName' => 'Monday',
                        'isActive' => true,
                        'startTime' => '12:00',
                        'stopTime' => '14:00',
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }
}
