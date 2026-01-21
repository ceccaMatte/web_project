<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\OrderFormService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

// Gestione pagina order-form (create / modify)
class OrderFormController extends Controller
{
    private OrderFormService $orderFormService;

    public function __construct(OrderFormService $orderFormService)
    {
        $this->orderFormService = $orderFormService;
    }

    public function create()
    {
        $user = Auth::user();
        $date = request()->query('date', now()->toDateString());
        $reorderFromId = request()->query('reorder');
        
        // Se reorder, carica ingredienti dall'ordine esistente
        $reorderIngredients = [];
        if ($reorderFromId) {
            $sourceOrder = Order::with('ingredients')
                ->where('user_id', $user->id)
                ->find($reorderFromId);
            
            if ($sourceOrder) {
                // OrderIngredient sono snapshot; matchare per nome con Ingredient
                $ingredientNames = $sourceOrder->ingredients->pluck('name')->toArray();
                
                // Trova ingredienti attuali per nome
                $matchedIngredients = \App\Models\Ingredient::whereIn('name', $ingredientNames)->get();
                
                $reorderIngredients = $matchedIngredients->map(fn($i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'category' => $i->category,
                ])->toArray();
            }
        }
        
        return view('pages.order-form', [
            'mode' => 'create',
            'orderId' => null,
            'selectedDate' => $date,
            'user' => [
                'authenticated' => true,
                'enabled' => $user->is_enabled ?? true,
                'name' => $user->name,
            ],
            'reorderIngredients' => $reorderIngredients,
        ]);
    }

    public function edit(Order $order)
    {
        // Verifica ownership
        Gate::authorize('update', $order);
        
        // Verifica che l'ordine sia modificabile (pending)
        if ($order->status !== 'pending') {
            abort(403, 'Ordine non modificabile');
        }
        
        // Carica relazione workingDay per ottenere la data
        $order->load('workingDay');
        
        $user = Auth::user();
        
        return view('pages.order-form', [
            'mode' => 'modify',
            'orderId' => $order->id,
            'selectedDate' => $order->workingDay->day->toDateString(),
            'user' => [
                'authenticated' => true,
                'enabled' => $user->is_enabled ?? true,
                'name' => $user->name,
            ],
        ]);
    }

    public function apiCreate(): JsonResponse
    {
        $date = request()->query('date', now()->toDateString());
        $payload = $this->orderFormService->buildCreatePayload($date);
        
        return response()->json($payload);
    }

    public function apiModify(Order $order): JsonResponse
    {
        // Verifica ownership
        Gate::authorize('update', $order);
        
        // Verifica modificabilità
        if ($order->status !== 'pending') {
            return response()->json([
                'code' => 'NOT_MODIFIABLE',
                'message' => 'Ordine non modificabile',
            ], 422);
        }
        
        $payload = $this->orderFormService->buildModifyPayload($order);
        
        return response()->json($payload);
    }

    public function apiAvailability(): JsonResponse
    {
        $date = request()->query('date');
        $availability = $this->orderFormService->getAvailabilityForPolling($date);
        
        return response()->json($availability);
    }
}
