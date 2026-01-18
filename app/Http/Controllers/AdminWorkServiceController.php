<?php

namespace App\Http\Controllers;

use App\Services\AdminWorkServiceService;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;
use Carbon\Carbon;

/**
 * AdminWorkServiceController
 * 
 * Controller per la pagina Admin Work Service.
 * Gestisce la visualizzazione e le API per la gestione operativa ordini.
 * 
 * ENDPOINTS:
 * - GET /admin/work-service → Vista pagina
 * - GET /api/admin/work-service?date=YYYY-MM-DD → Fetch iniziale
 * - GET /api/admin/work-service/poll?date=YYYY-MM-DD → Polling
 * - POST /api/admin/orders/{order}/status → Cambio stato ordine
 */
class AdminWorkServiceController extends Controller
{
    public function __construct(
        private AdminWorkServiceService $workService
    ) {}

    /**
     * GET /admin/work-service
     * 
     * Mostra la pagina Admin Work Service.
     * I dati vengono caricati via JS dopo il render iniziale.
     */
    public function index(Request $request): View
    {
        $user = auth()->user();
        
        return view('pages.admin-work-service', [
            'user' => [
                'authenticated' => true,
                'name' => $user->name,
                'nickname' => $user->nickname,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * GET /api/admin/work-service?date=YYYY-MM-DD
     * 
     * Fetch iniziale dei dati per una data specifica.
     * Restituisce time slots + ordini + currentTimeSlotId.
     */
    public function apiIndex(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $date = $request->input('date');
        $data = $this->workService->getWorkServiceData($date);

        return response()->json($data);
    }

    /**
     * GET /api/admin/work-service/poll?date=YYYY-MM-DD
     * 
     * Polling endpoint - stessa struttura del fetch iniziale.
     * Il frontend decide cosa aggiornare e cosa mantenere.
     */
    public function apiPoll(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $date = $request->input('date');
        $data = $this->workService->getWorkServiceData($date);

        return response()->json($data);
    }

    /**
     * POST /api/admin/orders/{order}/status
     * 
     * Cambia lo stato di un ordine.
     * Accetta qualsiasi stato valido (admin override).
     * 
     * Body: { "status": "confirmed" | "ready" | "picked_up" | "pending" | "rejected" }
     */
    public function changeStatus(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,ready,picked_up,rejected',
        ]);

        $newStatus = $request->input('status');

        try {
            $updatedOrder = $this->workService->changeOrderStatus($order, $newStatus);

            return response()->json([
                'success' => true,
                'order' => [
                    'id' => $updatedOrder->id,
                    'status' => $updatedOrder->status,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
