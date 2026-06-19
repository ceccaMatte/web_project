<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\TimeSlot;
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
        if (!$user->enabled) {
            abort(403, 'Account bloccato: non puoi creare nuove prenotazioni.');
        }

        $date = request()->query('date', now()->toDateString());
        $selectedTimeSlotId = null;

        if ($slotId = request()->query('slot')) {
            $slot = TimeSlot::with('workingDay')->find($slotId);
            if ($slot && $slot->workingDay) {
                $date = $slot->workingDay->day->toDateString();
                $selectedTimeSlotId = $slot->id;
            }
        }

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
                'enabled' => $user->enabled,
                'name' => $user->name,
            ],
            'reorderIngredients' => $reorderIngredients,
            'selectedTimeSlotId' => $selectedTimeSlotId,
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
                'enabled' => $user->enabled,
                'name' => $user->name,
            ],
        ]);
    }

    public function apiCreate(): JsonResponse
    {
        if (!request()->user()->enabled) {
            return response()->json([
                'code' => 'USER_DISABLED',
                'message' => 'Account bloccato: non puoi creare nuove prenotazioni.',
            ], 403);
        }

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
