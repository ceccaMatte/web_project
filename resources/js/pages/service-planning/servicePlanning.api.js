/**
 * SERVICE PLANNING API LAYER
 * 
 * RESPONSABILITÀ:
 * - Gestisce comunicazione HTTP con backend
 * - Centralizza endpoint API per Service Planning
 * - Fornisce error handling consistente
 * 
 * ENDPOINTS:
 * - GET /api/admin/service-planning?week_start=YYYY-MM-DD → Fetch dati settimana
 * - POST /api/admin/service-planning → Salva configurazione settimana
 */

/**
 * Fetch dati per una settimana
 * 
 * ENDPOINT: GET /api/admin/service-planning?week_start=YYYY-MM-DD
 * 
 * RESPONSE: {
 *   weekStart: "2026-01-19",
 *   weekEnd: "2026-01-25",
 *   isEditable: true,
 *   globalConstraints: {
 *     maxOrdersPerSlot: 10,
 *     maxPendingTime: 30,
 *     location: "Piazza Centrale"
 *   },
 *   days: [
 *     {
 *       date: "2026-01-19",
 *       dayOfWeek: 0,
 *       dayName: "Monday",
 *       dayNameShort: "Mon",
 *       dayNumber: 19,
 *       isActive: true,
 *       startTime: "12:00",
 *       endTime: "20:00",
 *       isEditable: true,
 *       hasOrders: false,
 *       ordersCount: 0
 *     },
 *     ...
 *   ]
 * }
 * 
 * @param {string} weekStart - Data di inizio settimana (YYYY-MM-DD)
 * @returns {Promise<Object>} - Dati settimana
 */
export async function fetchWeekData(weekStart) {
    if (!weekStart) {
        throw new Error('[ServicePlanningAPI] fetchWeekData: weekStart is required');
    }

    console.log(`[ServicePlanningAPI] Fetching week data for ${weekStart}...`);

    try {
        const response = await fetch(`/api/admin/service-planning?weekStart=${weekStart}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[ServicePlanningAPI] Week data fetched:', data);
        return data;
    } catch (error) {
        console.error('[ServicePlanningAPI] Failed to fetch week data:', error);
        throw error;
    }
}

/**
 * Salva configurazione settimana
 * 
 * ENDPOINT: POST /api/admin/service-planning
 * 
 * BODY: {
 *   weekStart: "2026-01-19",
 *   weekEnd: "2026-01-25",
 *   globalConstraints: {
 *     maxOrdersPerSlot: 10,
 *     maxPendingTime: 30,
 *     location: "Piazza Centrale"
 *   },
 *   days: [
 *     {
 *       date: "2026-01-20",
 *       isActive: true,
 *       startTime: "12:00",
 *       endTime: "20:00"
 *     },
 *     ...
 *   ]
 * }
 * 
 * RESPONSE: {
 *   success: true,
 *   message: "Configuration saved",
 *   rejectedOrdersCount: 0
 * }
 * 
 * @param {Object} data - Dati da salvare
 * @returns {Promise<Object>} - Response
 */
export async function saveWeekConfiguration(data) {
    console.log('[ServicePlanningAPI] Saving week configuration:', data);

    try {
        const response = await fetch('/api/admin/service-planning', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[ServicePlanningAPI] Configuration saved:', result);
        return result;
    } catch (error) {
        console.error('[ServicePlanningAPI] Failed to save configuration:', error);
        throw error;
    }
}

export default { fetchWeekData, saveWeekConfiguration };
