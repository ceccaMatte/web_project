<?php

namespace App\Http\Controllers;

use App\Services\AdminWorkServiceService;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;
use Carbon\Carbon;

// Controller per la pagina Admin Work Service
class AdminWorkServiceController extends Controller
{
    public function __construct(
        private AdminWorkServiceService $workService
    ) {}

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

    public function apiIndex(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $date = $request->input('date');
        $data = $this->workService->getWorkServiceData($date);

        return response()->json($data);
    }

    public function apiPoll(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $date = $request->input('date');
        $data = $this->workService->getWorkServiceData($date);

        return response()->json($data);
    }

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
