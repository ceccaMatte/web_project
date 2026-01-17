<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\OrderFormService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

/**
 * Controller per la pagina Order Form (Create / Modify).
 * 
 * RESPONSABILITÀ:
 * - Gestire view create e modify (stessa pagina, mode diversa)
 * - API per init, availability polling
 * 
 * REGOLE:
 * - CREATE: nessun orderId, mode = "create"
 * - MODIFY: orderId presente, mode = "modify"
 * - Il backend è l'unica fonte di verità
 */
class OrderFormController extends Controller
{
    private OrderFormService $orderFormService;

    public function __construct(OrderFormService $orderFormService)
    {
        $this->orderFormService = $orderFormService;
    }

    /**
     * Mostra pagina CREATE order.
     * 
     * GET /orders/create
     */
    public function create()
    {
        $user = Auth::user();
        $date = request()->query('date', now()->toDateString());
        
        return view('pages.order-form', [
            'mode' => 'create',
            'orderId' => null,
            'selectedDate' => $date,
            'user' => [
                'authenticated' => true,
                'name' => $user->name,
            ],
        ]);
    }

    /**
     * Mostra pagina MODIFY order.
     * 
     * GET /orders/{order}/edit
     */
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
                'name' => $user->name,
            ],
        ]);
    }

    /**
     * API: Init pagina CREATE.
     * 
     * GET /api/orders/form/create?date=YYYY-MM-DD
     * 
     * Response: payload completo per create mode
     */
    public function apiCreate(): JsonResponse
    {
        $date = request()->query('date', now()->toDateString());
        $payload = $this->orderFormService->buildCreatePayload($date);
        
        return response()->json($payload);
    }

    /**
     * API: Init pagina MODIFY.
     * 
     * GET /api/orders/{order}/form
     * 
     * Response: payload completo per modify mode
     */
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

    /**
     * API: Polling disponibilità.
     * 
     * GET /api/orders/form/availability?date=YYYY-MM-DD
     * 
     * Response: ingredienti e time slots aggiornati
     */
    public function apiAvailability(): JsonResponse
    {
        $date = request()->query('date');
        $availability = $this->orderFormService->getAvailabilityForPolling($date);
        
        return response()->json($availability);
    }
}
