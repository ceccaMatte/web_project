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

// Controller ordini: orchestration e mapping degli errori di dominio su HTTP
class OrderController extends Controller
{
    private OrderService $orderService;
    private OrdersPageService $ordersPageService;

    public function __construct(OrderService $orderService, OrdersPageService $ordersPageService)
    {
        $this->orderService = $orderService;
        $this->ordersPageService = $ordersPageService;
    }

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

    public function apiInit(): JsonResponse
    {
        $date = request()->query('date', now()->toDateString());
        $payload = $this->ordersPageService->buildOrdersPagePayload($date);
        return response()->json($payload);
    }

    public function apiActiveOrders(): JsonResponse
    {
        $date = request()->query('date', now()->toDateString());
        $orders = $this->ordersPageService->getActiveOrdersForDate($date);
        
        return response()->json(['orders' => $orders]);
    }

    public function apiRecentOrders(): JsonResponse
    {
        $orders = $this->ordersPageService->getRecentOrders();
        return response()->json(['orders' => $orders]);
    }

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

    private function handleDomainError(DomainError $error): JsonResponse
    {
        return response()->json([
            'code' => $error->code(),
            'message' => $error->message(),
        ], $error->httpStatus());
    }
}

