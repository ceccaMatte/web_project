<?php

namespace App\Http\Controllers;

use App\Services\ServicePlanningService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;
use Carbon\Carbon;

/**
 * ServicePlanningController
 * 
 * Controller per la pagina Admin Service Planning.
 * Gestisce la configurazione settimanale del servizio.
 * 
 * ENDPOINTS:
 * - GET /admin/service-planning → Vista pagina
 * - GET /api/admin/service-planning?weekStart=YYYY-MM-DD → Fetch dati settimana
 * - POST /api/admin/service-planning → Salva configurazione settimana
 */
class ServicePlanningController extends Controller
{
    public function __construct(
        private ServicePlanningService $planningService
    ) {}

    /**
     * GET /admin/service-planning
     * 
     * Mostra la pagina Admin Service Planning.
     * I dati vengono caricati via JS dopo il render iniziale.
     */
    public function index(Request $request): View
    {
        $user = auth()->user();
        
        return view('pages.admin-service-planning', [
            'user' => [
                'authenticated' => true,
                'name' => $user->name,
                'nickname' => $user->nickname,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * GET /api/admin/service-planning?weekStart=YYYY-MM-DD
     * 
     * Fetch configurazione per una settimana specifica.
     * Restituisce constraints globali + configurazione 7 giorni.
     * 
     * Se weekStart non fornito, usa la settimana corrente.
     */
    public function apiIndex(Request $request): JsonResponse
    {
        $request->validate([
            'weekStart' => 'sometimes|date_format:Y-m-d',
        ]);

        // Se non fornito, calcola l'inizio della settimana corrente (lunedì)
        $weekStart = $request->input('weekStart');
        if (!$weekStart) {
            $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->format('Y-m-d');
        }

        $data = $this->planningService->getWeekConfiguration($weekStart);

        return response()->json($data);
    }

    /**
     * POST /api/admin/service-planning
     * 
     * Salva la configurazione per una settimana.
     * 
     * Body:
     * {
     *   "weekStart": "YYYY-MM-DD",
     *   "globalConstraints": {
     *     "maxOrdersPerSlot": 10,
     *     "maxPendingTime": 30,
     *     "location": "Piazza Centrale"
     *   },
     *   "days": [
     *     {
     *       "date": "YYYY-MM-DD",
     *       "isActive": true,
     *       "startTime": "12:00",
     *       "endTime": "20:00"
     *     },
     *     ...
     *   ]
     * }
     */
    public function apiSave(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'weekStart' => 'required|date_format:Y-m-d',
            'globalConstraints' => 'required|array',
            'globalConstraints.maxOrdersPerSlot' => 'required|integer|min:1|max:100',
            'globalConstraints.maxPendingTime' => 'required|integer|min:1|max:120',
            'globalConstraints.location' => 'required|string|max:255',
            'days' => 'required|array|size:7',
            'days.*.date' => 'required|date_format:Y-m-d',
            'days.*.isActive' => 'required|boolean',
            'days.*.startTime' => 'required_if:days.*.isActive,true|nullable|date_format:H:i',
            'days.*.endTime' => 'required_if:days.*.isActive,true|nullable|date_format:H:i',
        ]);

        try {
            $this->planningService->saveWeekConfiguration($validated);

            return response()->json([
                'success' => true,
                'message' => 'Configuration saved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
