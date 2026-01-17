<?php

namespace App\Http\Controllers;

use App\Domain\Errors\DomainError;
use App\Http\Requests\CreateOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\OrdersPageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

/**
 * Controller per la gestione degli ordini.
 * 
 * RESPONSABILITÀ:
 * - Riceve le richieste HTTP
 * - Valida l'input (via FormRequest)
 * - Chiama l'OrderService per la logica di business
 * - Converte gli errori di dominio in risposte HTTP
 * - Restituisce JSON con dati o errori
 * 
 * COSA NON FA:
 * - Non contiene logica di business
 * - Non accede direttamente al DB (usa il Service)
 * - Non crea messaggi di errore inline
 * 
 * GESTIONE ERRORI:
 * Tutti i DomainError vengono catturati e convertiti in:
 * {
 *   "code": "SLOT_FULL",
 *   "message": "Lo slot è pieno...",
 * }
 * Con lo status HTTP appropriato (409, 422, 403, ecc.)
 */
class OrderController extends Controller
{
    private OrderService $orderService;
    private OrdersPageService $ordersPageService;

    /**
     * Dependency injection dei services.
     */
    public function __construct(OrderService $orderService, OrdersPageService $ordersPageService)
    {
        $this->orderService = $orderService;
        $this->ordersPageService = $ordersPageService;
    }

    /**
     * Mostra pagina ordini dell'utente autenticato.
     * 
     * GET /orders
     * 
     * @return \Illuminate\View\View
     */
    public function index()
    {
        $user = Auth::user();
        
        // Prepara dati per la view (passati inline via script tags)
        $userData = [
            'authenticated' => true,
            'enabled' => $user->enabled,
            'name' => $user->name,
        ];
        
        // Scheduler data (stessa struttura della home)
        $scheduler = $this->ordersPageService->buildOrdersPagePayload()['scheduler'];
        
        return view('pages.orders', [
            'user' => $userData,
            'scheduler' => $scheduler,
        ]);
    }

    /**
     * API: Inizializza pagina ordini (dati completi).
     * 
     * GET /api/orders/init?date=YYYY-MM-DD
     * 
     * Query params:
     * - date: YYYY-MM-DD (opzionale, default: oggi)
     * 
     * Response:
     * {
     *   user: { authenticated, enabled, name },
     *   scheduler: { selectedDayId, monthLabel, weekDays },
     *   activeOrders: [...],
     *   recentOrders: [...]
     * }
     * 
     * @return JsonResponse
     */
    public function apiInit(): JsonResponse
    {
        $date = request()->query('date', now()->toDateString());
        $payload = $this->ordersPageService->buildOrdersPagePayload($date);
        return response()->json($payload);
    }

    /**
     * API: Ordini attivi per una data specifica.
     * 
     * GET /api/orders?date=YYYY-MM-DD
     * 
     * Response:
     * {
     *   orders: [...]
     * }
     * 
     * @return JsonResponse
     */
    public function apiActiveOrders(): JsonResponse
    {
        $date = request()->query('date', now()->toDateString());
        $orders = $this->ordersPageService->getActiveOrdersForDate($date);
        
        return response()->json(['orders' => $orders]);
    }

    /**
     * API: Ordini recenti (storico).
     * 
     * GET /api/orders/recent
     * 
     * Response:
     * {
     *   orders: [...]
     * }
     * 
     * @return JsonResponse
     */
    public function apiRecentOrders(): JsonResponse
    {
        $orders = $this->ordersPageService->getRecentOrders();
        return response()->json(['orders' => $orders]);
    }

    /**
     * Crea un nuovo ordine.
     * 
     * POST /orders
     * Body: { time_slot_id: 1, ingredients: [1, 3, 5] }
     * 
     * Risposte:
     * - 201: ordine creato con successo
     * - 409: slot pieno
     * - 422: validazione fallita
     */
    public function store(CreateOrderRequest $request): JsonResponse
    {
        try {
            $order = $this->orderService->createOrder(
                user: $request->user(),
                timeSlotId: $request->validated('time_slot_id'),
                ingredientIds: $request->validated('ingredients')
            );

            return response()->json([
                'message' => 'Ordine creato con successo.',
                'order' => $order->load(['timeSlot', 'ingredients']),
            ], 201);

        } catch (DomainError $e) {
            return $this->handleDomainError($e);
        }
    }

    /**
     * Aggiorna un ordine esistente.
     * 
     * PUT /orders/{order}
     * Body: { ingredients: [1, 3, 5] }
     * 
     * Risposte:
     * - 200: ordine aggiornato
     * - 403: non autorizzato (non proprietario)
     * - 422: non modificabile (non pending) o validazione fallita
     */
    public function update(UpdateOrderRequest $request, Order $order): JsonResponse
    {
        // Verifica autorizzazione via Policy
        Gate::authorize('update', $order);

        try {
            $updatedOrder = $this->orderService->updateOrder(
                order: $order,
                user: $request->user(),
                ingredientIds: $request->validated('ingredients')
            );

            return response()->json([
                'message' => 'Ordine aggiornato con successo.',
                'order' => $updatedOrder->load(['timeSlot', 'ingredients']),
            ]);

        } catch (DomainError $e) {
            return $this->handleDomainError($e);
        }
    }

    /**
     * Elimina un ordine.
     * 
     * DELETE /orders/{order}
     * 
     * Risposte:
     * - 200: ordine eliminato
     * - 403: non autorizzato (non proprietario)
     * - 422: non eliminabile (non pending)
     */
    public function destroy(Order $order): JsonResponse
    {
        // Verifica autorizzazione via Policy
        Gate::authorize('delete', $order);

        try {
            $this->orderService->deleteOrder(
                order: $order,
                user: request()->user()
            );

            return response()->json([
                'message' => 'Ordine eliminato con successo.',
            ]);

        } catch (DomainError $e) {
            return $this->handleDomainError($e);
        }
    }

    /**
     * Cambia lo stato di un ordine (solo admin).
     * 
     * PUT /admin/orders/{order}/status
     * Body: { status: "confirmed" }
     * 
     * Risposte:
     * - 200: stato aggiornato
     * - 403: non admin
     * - 422: transizione non consentita
     */
    public function changeStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        // Verifica autorizzazione via Policy
        Gate::authorize('changeStatus', $order);

        try {
            $updatedOrder = $this->orderService->changeStatus(
                order: $order,
                newStatus: $request->validated('status')
            );

            return response()->json([
                'message' => 'Stato ordine aggiornato con successo.',
                'order' => $updatedOrder->load(['timeSlot', 'ingredients']),
            ]);

        } catch (DomainError $e) {
            return $this->handleDomainError($e);
        }
    }

    /**
     * Converte un DomainError in una risposta HTTP JSON.
     * 
     * IMPORTANTE:
     * - Non crea messaggi di errore qui
     * - Usa code() e message() dell'errore di dominio
     * - Usa httpStatus() per lo status HTTP
     * 
     * Questo mantiene la separazione tra dominio e HTTP.
     */
    private function handleDomainError(DomainError $error): JsonResponse
    {
        return response()->json([
            'code' => $error->code(),
            'message' => $error->message(),
        ], $error->httpStatus());
    }
}

