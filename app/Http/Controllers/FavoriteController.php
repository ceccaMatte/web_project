<?php

namespace App\Http\Controllers;

use App\Models\FavoriteSandwich;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

/**
 * Controller per la gestione dei preferiti.
 * 
 * RESPONSABILITÀ:
 * - Toggle preferito per una configurazione ingredienti
 * - Verifica autenticazione utente
 * - Restituisce nuovo stato is_favorite
 */
class FavoriteController extends Controller
{
    /**
     * Toggle preferito per una configurazione ingredienti.
     * 
     * POST /api/favorites/toggle
     * Body: { ingredient_configuration_id: "abc123..." }
     * 
     * Risposte:
     * - 200: { success: true, is_favorite: true|false }
     * - 401: Non autenticato
     * - 422: Validazione fallita
     * - 404: Configurazione non trovata (nessun ordine con quella config)
     */
    public function toggle(Request $request): JsonResponse
    {
        // Verifica autenticazione
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }

        $userId = Auth::id();

        // Valida input
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

        // Trova un ordine dell'utente con questa configurazione per ottenere gli ingredienti
        $order = $this->findOrderWithConfiguration($userId, $configId);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'No order found with this ingredient configuration',
            ], 404);
        }

        // Ottieni nomi ingredienti dall'ordine
        $ingredientNames = $order->ingredients->pluck('name')->toArray();

        // Toggle preferito
        $isFavorite = FavoriteSandwich::toggle($userId, $configId, $ingredientNames);

        return response()->json([
            'success' => true,
            'is_favorite' => $isFavorite,
        ]);
    }

    /**
     * Trova un ordine dell'utente con una specifica configurazione ingredienti.
     * 
     * @param int $userId
     * @param string $configId
     * @return Order|null
     */
    private function findOrderWithConfiguration(int $userId, string $configId): ?Order
    {
        // Recupera tutti gli ordini dell'utente con ingredienti
        $orders = Order::where('user_id', $userId)
            ->with('ingredients')
            ->get();

        // Trova l'ordine che ha questa configurazione
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
