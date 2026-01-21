<?php

namespace App\Http\Controllers;

use App\Models\FavoriteSandwich;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class FavoriteController extends Controller
{
    public function toggle(Request $request): JsonResponse
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }

        $userId = Auth::id();

        $validator = Validator::make($request->all(), [
            'ingredient_configuration_id' => 'required|string|size:16',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid ingredient_configuration_id',
                'errors' => $validator->errors(),
            ], 422);
        }

        $configId = $request->input('ingredient_configuration_id');

        $order = $this->findOrderWithConfiguration($userId, $configId);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'No order found with this ingredient configuration',
            ], 404);
        }

        $ingredientNames = $order->ingredients->pluck('name')->toArray();

        $isFavorite = FavoriteSandwich::toggle($userId, $configId, $ingredientNames);

        return response()->json([
            'success' => true,
            'is_favorite' => $isFavorite,
        ]);
    }

    private function findOrderWithConfiguration(int $userId, string $configId): ?Order
    {
        $orders = Order::where('user_id', $userId)
            ->with('ingredients')
            ->get();

        foreach ($orders as $order) {
            $ingredientNames = $order->ingredients->pluck('name')->toArray();
            $orderConfigId = FavoriteSandwich::generateConfigurationId($ingredientNames);

            if ($orderConfigId === $configId) {
                return $order;
            }
        }

        return null;
    }
}
