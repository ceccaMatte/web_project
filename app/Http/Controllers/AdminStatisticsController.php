<?php

namespace App\Http\Controllers;

use App\Services\AdminStatisticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AdminStatisticsController extends Controller
{
    public function __construct(
        private AdminStatisticsService $statisticsService
    ) {}

    public function index(): View
    {
        $user = auth()->user();

        return view('pages.admin-statistics', [
            'user' => [
                'authenticated' => true,
                'name' => $user->name,
                'nickname' => $user->nickname,
                'role' => $user->role,
            ],
            'defaultFrom' => now()->subDays(30)->toDateString(),
            'defaultTo' => now()->toDateString(),
        ]);
    }

    public function apiIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $from = $validated['from'] ?? now()->subDays(30)->toDateString();
        $to = $validated['to'] ?? now()->toDateString();

        return response()->json($this->statisticsService->buildStats($from, $to));
    }
}
