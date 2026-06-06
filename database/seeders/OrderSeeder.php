<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderIngredient;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\WorkingDay;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Seeder per ordini demo plausibili.
 *
 * Ogni utente normale riceve ordini sparsi tra settimana corrente e prossima.
 */
class OrderSeeder extends Seeder
{
    use WithoutModelEvents;

    private int $maxOrdersPerSlot;

    private array $ingredientsByCategory = [];

    public function run(): void
    {
        $this->maxOrdersPerSlot = config('panini.max_orders_per_slot');
        $this->loadIngredientsByCategory();

        $workingDays = WorkingDay::where('is_active', true)
            ->orderBy('day')
            ->get();

        $normalUsers = User::where('role', 'user')
            ->orderBy('id')
            ->get();

        foreach ($normalUsers as $index => $user) {
            $this->createOrdersForUser($user, $workingDays, $index);
        }
    }

    private function loadIngredientsByCategory(): void
    {
        Ingredient::where('is_available', true)
            ->get()
            ->groupBy('category')
            ->each(function ($ingredients, string $category): void {
                $this->ingredientsByCategory[$category] = $ingredients->values()->all();
            });
    }

    private function createOrdersForUser(User $user, $workingDays, int $userIndex): void
    {
        if ($workingDays->isEmpty()) {
            return;
        }

        $ordersPerUser = 7 + ($userIndex % 3);
        $selectedDays = $workingDays
            ->values()
            ->filter(fn (WorkingDay $workingDay, int $index) => (($index + $userIndex) % 2) === 0)
            ->values();

        if ($selectedDays->isEmpty()) {
            $selectedDays = $workingDays->values();
        }

        for ($i = 0; $i < $ordersPerUser; $i++) {
            $workingDay = $selectedDays[$i % $selectedDays->count()];
            $this->createSingleOrder($user, $workingDay, $i);
        }
    }

    private function createSingleOrder(User $user, WorkingDay $workingDay, int $sequence): void
    {
        $slot = $this->findAvailableSlot($workingDay, $sequence);

        if (!$slot) {
            return;
        }

        $order = Order::create([
            'user_id' => $user->id,
            'time_slot_id' => $slot->id,
            'working_day_id' => $workingDay->id,
            'status' => $this->determineOrderStatus(Carbon::parse($workingDay->day), $sequence),
            'daily_number' => Order::where('working_day_id', $workingDay->id)->count() + 1,
            'created_at' => $this->createdAtFor($workingDay),
            'updated_at' => now(),
        ]);

        $this->attachIngredientsToOrder($order, $this->generateSandwich($sequence));
    }

    private function findAvailableSlot(WorkingDay $workingDay, int $sequence): ?TimeSlot
    {
        $slots = TimeSlot::where('working_day_id', $workingDay->id)
            ->orderBy('start_time')
            ->get()
            ->values();

        if ($slots->isEmpty()) {
            return null;
        }

        for ($i = 0; $i < $slots->count(); $i++) {
            $slot = $slots[($sequence + $i * 3) % $slots->count()];
            $orderCount = Order::where('time_slot_id', $slot->id)->count();

            if ($orderCount < $this->maxOrdersPerSlot) {
                return $slot;
            }
        }

        return null;
    }

    private function determineOrderStatus(Carbon $date, int $sequence): string
    {
        if (app()->environment('testing') && $date->greaterThan(Carbon::parse('2026-01-29'))) {
            return 'pending';
        }

        $today = Carbon::today();

        if ($date->isPast() && !$date->isSameDay($today)) {
            return $sequence % 4 === 0 ? 'picked_up' : 'ready';
        }

        if ($date->isSameDay($today)) {
            return ['pending', 'confirmed', 'ready', 'picked_up'][$sequence % 4];
        }

        return 'pending';
    }

    private function createdAtFor(WorkingDay $workingDay): Carbon
    {
        $day = Carbon::parse($workingDay->day);

        if ($day->isFuture()) {
            return now()->subHours(rand(1, 48));
        }

        return $day->clone()->setTime(rand(8, 11), rand(0, 59));
    }

    private function generateSandwich(int $sequence): array
    {
        $ingredientIds = [];

        $ingredientIds = array_merge($ingredientIds, $this->pickFromCategory('bread', 1, 1, $sequence));
        $ingredientIds = array_merge($ingredientIds, $this->pickFromCategory('meat', 1, 2, $sequence + 1));
        $ingredientIds = array_merge($ingredientIds, $this->pickFromCategory('cheese', 0, 1, $sequence + 2));
        $ingredientIds = array_merge($ingredientIds, $this->pickFromCategory('vegetable', 1, 3, $sequence + 3));
        $ingredientIds = array_merge($ingredientIds, $this->pickFromCategory('sauce', 0, 2, $sequence + 4));

        if ($sequence % 3 === 0) {
            $ingredientIds = array_merge($ingredientIds, $this->pickFromCategory('other', 1, 1, $sequence + 5));
        }

        return array_unique($ingredientIds);
    }

    private function pickFromCategory(string $category, int $min, int $max, int $offset): array
    {
        $ingredients = $this->ingredientsByCategory[$category] ?? [];

        if (empty($ingredients)) {
            return [];
        }

        $count = min(rand($min, $max), count($ingredients));
        $selected = [];

        for ($i = 0; $i < $count; $i++) {
            $ingredient = $ingredients[($offset + $i) % count($ingredients)];
            $selected[] = $ingredient->id;
        }

        return $selected;
    }

    private function attachIngredientsToOrder(Order $order, array $ingredientIds): void
    {
        foreach ($ingredientIds as $ingredientId) {
            $ingredient = Ingredient::find($ingredientId);

            if (!$ingredient) {
                continue;
            }

            OrderIngredient::create([
                'order_id' => $order->id,
                'name' => $ingredient->name,
                'category' => $ingredient->category,
            ]);
        }
    }
}
