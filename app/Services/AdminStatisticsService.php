<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminStatisticsService
{
    public function buildStats(string $from, string $to): array
    {
        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

        $ordersQuery = Order::query()
            ->whereBetween('orders.created_at', [$fromDate, $toDate]);

        $totalOrders = (clone $ordersQuery)->count();
        $rejectedOrders = (clone $ordersQuery)->where('status', 'rejected')->count();

        return [
            'range' => [
                'from' => $fromDate->toDateString(),
                'to' => $toDate->toDateString(),
            ],
            'summary' => [
                'total_orders' => $totalOrders,
                'rejected_orders' => $rejectedOrders,
                'active_orders' => max(0, $totalOrders - $rejectedOrders),
                'unique_customers' => (clone $ordersQuery)->distinct('user_id')->count('user_id'),
            ],
            'status_distribution' => $this->statusDistribution($fromDate, $toDate),
            'daily_trend' => $this->dailyTrend($fromDate, $toDate),
            'popular_slots' => $this->popularSlots($fromDate, $toDate),
            'popular_ingredients' => $this->popularIngredients($fromDate, $toDate),
            'top_customers' => $this->customersByFrequency($fromDate, $toDate, 'desc'),
            'least_customers' => $this->customersByFrequency($fromDate, $toDate, 'asc'),
        ];
    }

    private function statusDistribution(Carbon $from, Carbon $to): array
    {
        return Order::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('status')
            ->orderBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status,
                'total' => (int) $row->total,
            ])
            ->toArray();
    }

    private function dailyTrend(Carbon $from, Carbon $to): array
    {
        return Order::query()
            ->join('working_days', 'orders.working_day_id', '=', 'working_days.id')
            ->select('working_days.day as date', DB::raw('COUNT(orders.id) as total'))
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy('working_days.day')
            ->orderBy('working_days.day')
            ->get()
            ->map(fn ($row) => [
                'date' => Carbon::parse($row->date)->toDateString(),
                'total' => (int) $row->total,
            ])
            ->toArray();
    }

    private function popularSlots(Carbon $from, Carbon $to): array
    {
        return Order::query()
            ->join('time_slots', 'orders.time_slot_id', '=', 'time_slots.id')
            ->select('time_slots.start_time', 'time_slots.end_time', DB::raw('COUNT(orders.id) as total'))
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy('time_slots.start_time', 'time_slots.end_time')
            ->orderByDesc('total')
            ->orderBy('time_slots.start_time')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'start_time' => substr($row->start_time, 0, 5),
                'end_time' => substr($row->end_time, 0, 5),
                'total' => (int) $row->total,
            ])
            ->toArray();
    }

    private function popularIngredients(Carbon $from, Carbon $to): array
    {
        return DB::table('order_ingredients')
            ->join('orders', 'order_ingredients.order_id', '=', 'orders.id')
            ->select('order_ingredients.name', 'order_ingredients.category', DB::raw('COUNT(*) as total'))
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy('order_ingredients.name', 'order_ingredients.category')
            ->orderByDesc('total')
            ->orderBy('order_ingredients.name')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'category' => $row->category,
                'total' => (int) $row->total,
            ])
            ->toArray();
    }

    private function customersByFrequency(Carbon $from, Carbon $to, string $direction): array
    {
        $orderDirection = $direction === 'asc' ? 'asc' : 'desc';

        return User::query()
            ->leftJoin('orders', function ($join) use ($from, $to) {
                $join->on('users.id', '=', 'orders.user_id')
                    ->whereBetween('orders.created_at', [$from, $to]);
            })
            ->where('users.role', 'user')
            ->select('users.id', 'users.nickname', 'users.email', DB::raw('COUNT(orders.id) as total'))
            ->groupBy('users.id', 'users.nickname', 'users.email')
            ->orderBy('total', $orderDirection)
            ->orderBy('users.nickname')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'nickname' => $row->nickname,
                'email' => $row->email,
                'total' => (int) $row->total,
            ])
            ->toArray();
    }
}
