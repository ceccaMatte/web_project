<?php

namespace App\Http\Controllers;

use App\Constants\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AdminUserController extends Controller
{
    public function index(): View
    {
        $user = auth()->user();

        return view('pages.admin-users', [
            'user' => [
                'authenticated' => true,
                'name' => $user->name,
                'nickname' => $user->nickname,
                'role' => $user->role,
            ],
        ]);
    }

    public function apiIndex(): JsonResponse
    {
        $users = User::where('role', Role::USER)
            ->withCount([
                'orders',
                'orders as rejected_orders_count' => fn ($query) => $query->where('status', 'rejected'),
                'orders as picked_up_orders_count' => fn ($query) => $query->where('status', 'picked_up'),
            ])
            ->orderBy('enabled')
            ->orderBy('nickname')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'nickname' => $user->nickname,
                'email' => $user->email,
                'enabled' => $user->enabled,
                'orders_count' => $user->orders_count,
                'rejected_orders_count' => $user->rejected_orders_count,
                'picked_up_orders_count' => $user->picked_up_orders_count,
            ]);

        return response()->json([
            'users' => $users,
        ]);
    }

    public function updateEnabled(Request $request, User $user): JsonResponse
    {
        if ($user->role !== Role::USER) {
            return response()->json([
                'message' => 'Solo i clienti possono essere bloccati o sbloccati.',
            ], 422);
        }

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        $user->update([
            'enabled' => $validated['enabled'],
        ]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'enabled' => $user->enabled,
            ],
        ]);
    }
}
