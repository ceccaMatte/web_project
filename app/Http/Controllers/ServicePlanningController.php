<?php

namespace App\Http\Controllers;

use App\Services\ServicePlanningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * ServicePlanningController - Admin Week Configuration
 * 
 * Handles the Service Planning page for admin users to configure
 * weekly opening hours, time slots, and order constraints.
 * 
 * API Endpoints:
 * - GET  /admin/service-planning/config       → getConfig (initial data)
 * - GET  /admin/service-planning/week/{date}  → getWeek (week configuration)
 * - POST /admin/service-planning/week/{date}  → saveWeek (save configuration)
 */
class ServicePlanningController extends Controller
{
    private ServicePlanningService $servicePlanningService;

    public function __construct(ServicePlanningService $servicePlanningService)
    {
        $this->servicePlanningService = $servicePlanningService;
    }

    /**
     * Render the Service Planning page (Blade view)
     */
    public function index()
    {
        return view('pages.admin-service-planning', [
            'user' => auth()->user(),
        ]);
    }

    /**
     * GET /admin/service-planning/config
     * 
     * Returns global configuration needed for initial page setup:
     * - Min/max values for constraints
     * - Default times
     * - Slot duration
     * - Location info
     * 
     * @return JsonResponse
     */
    public function getConfig(): JsonResponse
    {
        try {
            $config = $this->servicePlanningService->getConfig();
            
            Log::info('[ServicePlanningController] getConfig called', [
                'slotDuration' => $config['slotDuration'] ?? null,
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $config,
            ]);
        } catch (\Exception $e) {
            Log::error('[ServicePlanningController] getConfig failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Errore nel recupero della configurazione',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /admin/service-planning/week/{startDate}
     * 
     * Returns the configuration for a specific week.
     * 
     * @param string $startDate Monday of the week (Y-m-d format)
     * @return JsonResponse
     */
    public function getWeek(string $startDate): JsonResponse
    {
        try {
            // Validate date format
            if (!$this->isValidDate($startDate)) {
                Log::warning('[ServicePlanningController] getWeek: invalid date format', [
                    'startDate' => $startDate,
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Formato data non valido. Usare YYYY-MM-DD.',
                ], 400);
            }
            
            Log::info('[ServicePlanningController] getWeek called', [
                'startDate' => $startDate,
            ]);
            
            $weekData = $this->servicePlanningService->getWeekConfiguration($startDate);
            
            return response()->json([
                'success' => true,
                'data' => $weekData,
            ]);
        } catch (\Exception $e) {
            Log::error('[ServicePlanningController] getWeek failed', [
                'startDate' => $startDate,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Errore nel recupero della configurazione settimanale',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * POST /admin/service-planning/week/{startDate}
     * 
     * Saves the configuration for a specific week.
     * Validates all input data and returns a report of operations.
     * 
     * @param Request $request
     * @param string $startDate Monday of the week (Y-m-d format)
     * @return JsonResponse
     */
    public function saveWeek(Request $request, string $startDate): JsonResponse
    {
        try {
            // Validate date format
            if (!$this->isValidDate($startDate)) {
                Log::warning('[ServicePlanningController] saveWeek: invalid date format', [
                    'startDate' => $startDate,
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Formato data non valido. Usare YYYY-MM-DD.',
                ], 400);
            }
            
            // Validate request payload
            $validated = $this->validateSaveRequest($request);
            
            Log::info('[ServicePlanningController] saveWeek called', [
                'startDate' => $startDate,
                'globalConstraints' => $validated['globalConstraints'] ?? null,
                'daysCount' => count($validated['days'] ?? []),
            ]);
            
            // Call service to save configuration
            $result = $this->servicePlanningService->saveWeekConfiguration(
                $startDate,
                $validated['globalConstraints'],
                $validated['days']
            );
            
            // Check if week was rejected (entirely in the past)
            if (!$result['saved']) {
                Log::warning('[ServicePlanningController] saveWeek: week rejected', [
                    'startDate' => $startDate,
                    'reason' => $result['message'] ?? 'Past week',
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => $result['message'] ?? 'Impossibile modificare una settimana passata',
                    'report' => $result['report'] ?? null,
                ], 422);
            }
            
            Log::info('[ServicePlanningController] saveWeek completed', [
                'startDate' => $startDate,
                'report' => $result['report'],
            ]);
            
            return response()->json([
                'success' => true,
                'message' => $this->buildSuccessMessage($result['report']),
                'report' => $result['report'],
            ]);
        } catch (ValidationException $e) {
            Log::warning('[ServicePlanningController] saveWeek: validation failed', [
                'startDate' => $startDate,
                'errors' => $e->errors(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Dati non validi',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('[ServicePlanningController] saveWeek failed', [
                'startDate' => $startDate,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Errore nel salvataggio della configurazione',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Validate the save request payload
     * 
     * @param Request $request
     * @return array Validated data
     * @throws ValidationException
     */
    private function validateSaveRequest(Request $request): array
    {
        $config = config('service_planning');
        
        return $request->validate([
            // Global constraints
            'globalConstraints' => 'required|array',
            'globalConstraints.maxOrdersPerSlot' => [
                'required',
                'integer',
                'min:' . ($config['min_max_orders_per_slot'] ?? 1),
                'max:' . ($config['max_max_orders_per_slot'] ?? 99),
            ],
            'globalConstraints.maxIngredientsPerOrder' => [
                'required',
                'integer',
                'min:' . ($config['min_max_ingredients'] ?? 1),
                'max:' . ($config['max_max_ingredients'] ?? 20),
            ],
            
            // Days array
            'days' => 'required|array|min:1|max:7',
            'days.*.date' => 'required|date_format:Y-m-d',
            'days.*.dayName' => 'required|string',
            'days.*.isActive' => 'required|boolean',
            
            // Time fields (required only if active)
            'days.*.startTime' => 'nullable|date_format:H:i|required_if:days.*.isActive,true',
            'days.*.stopTime' => 'nullable|date_format:H:i|required_if:days.*.isActive,true',
            
            // Editable flag
            'days.*.isEditable' => 'sometimes|boolean',
        ], [
            // Custom error messages in Italian
            'globalConstraints.required' => 'I vincoli globali sono obbligatori.',
            'globalConstraints.maxOrdersPerSlot.required' => 'Il numero massimo di ordini per slot è obbligatorio.',
            'globalConstraints.maxOrdersPerSlot.min' => 'Il numero massimo di ordini per slot deve essere almeno :min.',
            'globalConstraints.maxOrdersPerSlot.max' => 'Il numero massimo di ordini per slot non può superare :max.',
            'globalConstraints.maxIngredientsPerOrder.required' => 'Il numero massimo di ingredienti per ordine è obbligatorio.',
            'globalConstraints.maxIngredientsPerOrder.min' => 'Il numero massimo di ingredienti deve essere almeno :min.',
            'globalConstraints.maxIngredientsPerOrder.max' => 'Il numero massimo di ingredienti non può superare :max.',
            'days.required' => 'I giorni della settimana sono obbligatori.',
            'days.*.date.required' => 'La data del giorno è obbligatoria.',
            'days.*.date.date_format' => 'La data deve essere nel formato YYYY-MM-DD.',
            'days.*.dayName.required' => 'Il nome del giorno è obbligatorio.',
            'days.*.dayName.in' => 'Il nome del giorno non è valido.',
            'days.*.isActive.required' => 'Lo stato attivo/inattivo del giorno è obbligatorio.',
            'days.*.startTime.required_if' => 'L\'orario di inizio è obbligatorio per i giorni attivi.',
            'days.*.startTime.date_format' => 'L\'orario di inizio deve essere nel formato HH:MM.',
            'days.*.stopTime.required_if' => 'L\'orario di fine è obbligatorio per i giorni attivi.',
            'days.*.stopTime.date_format' => 'L\'orario di fine deve essere nel formato HH:MM.',
        ]);
    }

    /**
     * Check if a date string is valid Y-m-d format
     * 
     * @param string $date
     * @return bool
     */
    private function isValidDate(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    /**
     * Build a human-readable success message from the report
     * 
     * @param array $report
     * @return string
     */
    private function buildSuccessMessage(array $report): string
    {
        $parts = [];
        
        if (($report['daysCreated'] ?? 0) > 0) {
            $parts[] = "{$report['daysCreated']} giorn" . ($report['daysCreated'] === 1 ? 'o creato' : 'i creati');
        }
        
        if (($report['daysUpdated'] ?? 0) > 0) {
            $parts[] = "{$report['daysUpdated']} giorn" . ($report['daysUpdated'] === 1 ? 'o aggiornato' : 'i aggiornati');
        }
        
        if (($report['daysDisabled'] ?? 0) > 0) {
            $parts[] = "{$report['daysDisabled']} giorn" . ($report['daysDisabled'] === 1 ? 'o disabilitato' : 'i disabilitati');
        }
        
        if (($report['timeSlotsGenerated'] ?? 0) > 0) {
            $parts[] = "{$report['timeSlotsGenerated']} slot temporali generati";
        }
        
        if (($report['ordersRejected'] ?? 0) > 0) {
            $parts[] = "⚠️ {$report['ordersRejected']} ordin" . ($report['ordersRejected'] === 1 ? 'e rifiutato' : 'i rifiutati') . " (fuori orario)";
        }
        
        if (($report['daysSkipped'] ?? 0) > 0) {
            $parts[] = "{$report['daysSkipped']} giorn" . ($report['daysSkipped'] === 1 ? 'o saltato' : 'i saltati') . " (passato)";
        }
        
        if (empty($parts)) {
            return 'Configurazione salvata correttamente.';
        }
        
        return 'Configurazione salvata: ' . implode(', ', $parts) . '.';
    }
}
