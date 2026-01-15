/**
 * HOME API LAYER
 * 
 * RESPONSABILITÀ:
 * - Gestisce comunicazione HTTP con backend
 * - Centralizza endpoint API per Home page
 * - Fornisce error handling consistente
 * 
 * ARCHITETTURA:
 * - Funzioni pure che ritornano Promise
 * - No side effects (no DOM, no state mutation)
 * - Usato da home.hydration.js e home.actions.js
 * 
 * UTILIZZO:
 * import { fetchHome, fetchBookingForDay } from './home.api.js';
 * 
 * const data = await fetchHome();
 * const bookingData = await fetchBookingForDay('2026-01-16');
 */

/**
 * Fetch dati completi Home page
 * 
 * ENDPOINT: GET /api/home
 * 
 * RESPONSE: {
 *   user: { authenticated, enabled, name },
 *   todayService: { status, location, startTime, endTime, queueTime },
 *   scheduler: { selectedDayId, monthLabel, weekDays },
 *   ordersPreview: { variant, ordersCount, selectedOrder },
 *   booking: { dateLabel, locationLabel, slots }
 * }
 * 
 * @returns {Promise<Object>} - Home payload completo
 * @throws {Error} - Se fetch fallisce o response non ok
 */
export async function fetchHome() {
    console.log('[HomeAPI] Fetching /api/home...');

    try {
        const response = await fetch('/api/home', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[HomeAPI] /api/home fetched successfully');
        
        return data;
    } catch (error) {
        console.error('[HomeAPI] Failed to fetch /api/home:', error);
        throw error; // Re-throw per gestione chiamante
    }
}

/**
 * Fetch slot prenotabili per un giorno specifico
 * 
 * ENDPOINT: GET /api/booking?day=YYYY-MM-DD
 * 
 * TODO: Implementare endpoint backend se non esiste.
 * 
 * RESPONSE ATTESA: {
 *   dateLabel: "Friday, January 16",
 *   locationLabel: "Engineering Hub",
 *   slots: [
 *     {
 *       id: 13,
 *       timeLabel: "11:00",
 *       slotsLeft: 45,
 *       href: "/orders/create?slot=13",
 *       isDisabled: false
 *     },
 *     ...
 *   ]
 * }
 * 
 * @param {string} dayId - Data nel formato YYYY-MM-DD (es. "2026-01-16")
 * @returns {Promise<Object>} - Booking payload per il giorno
 * @throws {Error} - Se fetch fallisce o response non ok
 */
export async function fetchBookingForDay(dayId) {
    if (!dayId) {
        throw new Error('[HomeAPI] fetchBookingForDay: dayId is required');
    }

    console.log(`[HomeAPI] Fetching /api/booking?day=${dayId}...`);

    try {
        const response = await fetch(`/api/booking?day=${dayId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[HomeAPI] /api/booking?day=${dayId} fetched successfully`);
        
        return data;
    } catch (error) {
        console.error(`[HomeAPI] Failed to fetch /api/booking?day=${dayId}:`, error);
        throw error; // Re-throw per gestione chiamante
    }
}

/**
 * Export default per import aggregato
 */
export default {
    fetchHome,
    fetchBookingForDay,
};
