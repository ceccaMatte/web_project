/**
 * SERVICE PLANNING API LAYER
 * 
 * RESPONSABILITÀ:
 * - Gestisce comunicazione HTTP con backend
 * - Centralizza endpoint API per Service Planning
 * - Fornisce error handling consistente
 * - Logging per debug
 * 
 * ENDPOINTS:
 * - GET  /api/admin/service-planning/config            → fetchConfig (global config)
 * - GET  /api/admin/service-planning/week/{startDate}  → fetchWeekData
 * - POST /api/admin/service-planning/week/{startDate}  → saveWeekConfiguration
 */

const DEBUG = true;

function log(...args) {
    if (DEBUG) {
        console.log('[ServicePlanningAPI]', ...args);
    }
}

function warn(...args) {
    if (DEBUG) {
        console.warn('[ServicePlanningAPI]', ...args);
    }
}

function error(...args) {
    console.error('[ServicePlanningAPI]', ...args);
}

/**
 * Get CSRF token from meta tag
 * @returns {string}
 */
function getCsrfToken() {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!token) {
        warn('CSRF token not found in meta tag');
    }
    return token || '';
}

/**
 * Parse error response from backend
 * @param {Response} response
 * @returns {Promise<string>}
 */
async function parseErrorMessage(response) {
    try {
        const data = await response.json();
        if (data.message) {
            return data.message;
        }
        if (data.errors) {
            // Laravel validation errors
            const errorMessages = Object.values(data.errors).flat();
            return errorMessages.join(', ');
        }
        return `HTTP ${response.status}: ${response.statusText}`;
    } catch {
        return `HTTP ${response.status}: ${response.statusText}`;
    }
}

/**
 * Fetch global configuration
 * 
 * ENDPOINT: GET /api/admin/service-planning/config
 * 
 * RESPONSE: {
 *   success: true,
 *   data: {
 *     slotDuration: 15,
 *     minMaxOrdersPerSlot: 1,
 *     maxMaxOrdersPerSlot: 99,
 *     defaultMaxOrdersPerSlot: 10,
 *     minMaxIngredientsPerOrder: 1,
 *     maxMaxIngredientsPerOrder: 20,
 *     defaultMaxIngredientsPerOrder: 6,
 *     defaultStartTime: "12:00",
 *     defaultStopTime: "14:00",
 *     location: "Piazza Centrale"
 *   }
 * }
 * 
 * @returns {Promise<Object>}
 */
export async function fetchConfig() {
    log('Fetching global config...');

    try {
        const response = await fetch('/api/admin/service-planning/config', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            // Log full response body for easier debugging of validation errors
            try {
                const bodyText = await response.clone().text();
                console.error('[ServicePlanningAPI] Response body (non-ok):', bodyText);
            } catch (e) {
                console.error('[ServicePlanningAPI] Failed to read response body', e);
            }

            const errorMsg = await parseErrorMessage(response);
            throw new Error(errorMsg);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Unknown error');
        }

        log('Config fetched:', result.data);
        return result.data;
    } catch (err) {
        error('Failed to fetch config:', err);
        throw err;
    }
}

/**
 * Fetch week configuration
 * 
 * ENDPOINT: GET /api/admin/service-planning/week/{startDate}
 * 
 * RESPONSE: {
 *   success: true,
 *   data: {
 *     weekStart: "2026-01-19",
 *     weekEnd: "2026-01-25",
 *     hasPersistedData: true,
 *     isWeekEditable: true,
 *     globalConstraints: {
 *       maxOrdersPerSlot: 10,
 *       maxIngredientsPerOrder: 6,
 *       location: "Piazza Centrale"
 *     },
 *     days: [
 *       {
 *         date: "2026-01-19",
 *         dayOfWeek: 0,
 *         dayName: "lunedì",
 *         dayNameShort: "Lun",
 *         dayNumber: 19,
 *         isActive: true,
 *         startTime: "12:00",
 *         stopTime: "14:00",
 *         isEditable: true,
 *         hasOrders: false,
 *         ordersCount: 0
 *       },
 *       ...
 *     ]
 *   }
 * }
 * 
 * @param {string} weekStart - Data di inizio settimana (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function fetchWeekData(weekStart) {
    if (!weekStart) {
        throw new Error('fetchWeekData: weekStart is required');
    }

    log(`Fetching week data for ${weekStart}...`);

    try {
        const response = await fetch(`/api/admin/service-planning/week/${weekStart}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const errorMsg = await parseErrorMessage(response);
            throw new Error(errorMsg);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Unknown error');
        }

        log('Week data fetched:', result.data);
        return result.data;
    } catch (err) {
        error('Failed to fetch week data:', err);
        throw err;
    }
}

/**
 * Save week configuration
 * 
 * ENDPOINT: POST /api/admin/service-planning/week/{startDate}
 * 
 * BODY: {
 *   globalConstraints: {
 *     maxOrdersPerSlot: 10,
 *     maxIngredientsPerOrder: 6
 *   },
 *   days: [
 *     {
 *       date: "2026-01-20",
 *       dayName: "lunedì",
 *       isActive: true,
 *       startTime: "12:00",
 *       stopTime: "14:00"
 *     },
 *     ...
 *   ]
 * }
 * 
 * RESPONSE: {
 *   success: true,
 *   message: "Configurazione salvata: 5 giorni aggiornati, 40 slot generati.",
 *   report: {
 *     daysCreated: 0,
 *     daysUpdated: 5,
 *     daysDisabled: 0,
 *     daysSkipped: 2,
 *     timeSlotsGenerated: 40,
 *     ordersRejected: 0
 *   }
 * }
 * 
 * @param {string} weekStart - Data di inizio settimana (YYYY-MM-DD)
 * @param {Object} globalConstraints - Global constraints object
 * @param {Array} days - Array of day configurations
 * @returns {Promise<Object>}
 */
export async function saveWeekConfiguration(weekStart, globalConstraints, days) {
    if (!weekStart) {
        throw new Error('saveWeekConfiguration: weekStart is required');
    }
    if (!globalConstraints) {
        throw new Error('saveWeekConfiguration: globalConstraints is required');
    }
    if (!days || !Array.isArray(days)) {
        throw new Error('saveWeekConfiguration: days array is required');
    }

    log('Saving week configuration:', { weekStart, globalConstraints, days });

    try {
        const response = await fetch(`/api/admin/service-planning/week/${weekStart}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'include',
            body: JSON.stringify({
                globalConstraints,
                days,
            }),
        });

        if (!response.ok) {
            const errorMsg = await parseErrorMessage(response);
            throw new Error(errorMsg);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Unknown error');
        }

        log('Configuration saved:', result);
        return result;
    } catch (err) {
        error('Failed to save configuration:', err);
        throw err;
    }
}

/**
 * Build payload for saving from state
 * Utility function to transform state into API payload format
 * 
 * @param {Object} state - Current state object
 * @returns {Object} - { weekStart, globalConstraints, days }
 */
export function buildSavePayload(state) {
    if (!state || !state.globalConstraints || !state.days) {
        throw new Error('buildSavePayload: Invalid state');
    }

    const days = state.days.map(day => ({
        date: day.date,
        dayName: day.dayName,
        isActive: day.isActive,
        startTime: day.startTime,
        stopTime: day.stopTime,
        isEditable: day.isEditable,
    }));

    return {
        weekStart: state.weekStart,
        globalConstraints: {
            maxOrdersPerSlot: state.globalConstraints.maxOrdersPerSlot,
            maxIngredientsPerOrder: state.globalConstraints.maxIngredientsPerOrder,
        },
        days,
    };
}

// Export default object for compatibility
export default {
    fetchConfig,
    fetchWeekData,
    saveWeekConfiguration,
    buildSavePayload,
};
