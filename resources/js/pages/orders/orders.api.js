/**
 * ORDERS API LAYER
 * 
 * RESPONSABILITÀ:
 * - Gestisce comunicazione HTTP con backend
 * - Centralizza endpoint API per Orders page
 * - Fornisce error handling consistente
 * 
 * ARCHITETTURA:
 * - Funzioni pure che ritornano Promise
 * - No side effects (no DOM, no state mutation)
 * - Usato da orders.hydration.js e orders.actions.js
 * 
 * UTILIZZO:
 * import { fetchActiveOrders, fetchRecentOrders, toggleFavorite } from './orders.api.js';
 * 
 * const activeOrders = await fetchActiveOrders('2026-01-16');
 * const recentOrders = await fetchRecentOrders();
 * await toggleFavorite(configId);
 */

/**
 * Fetch ordini attivi per un giorno specifico
 * 
 * ENDPOINT: GET /api/orders?date=YYYY-MM-DD
 * 
 * RESPONSE: {
 *   orders: [
 *     {
 *       id: 42,
 *       status: "pending",
 *       date: "2026-01-17",
 *       time_slot: "11:30",
 *       is_modifiable: true,
 *       ingredients: [{ id: 1, name: "Sourdough" }, ...],
 *       ingredient_configuration_id: 99,
 *       is_favorite: true
 *     },
 *     ...
 *   ]
 * }
 * 
 * @param {string} date - Data nel formato YYYY-MM-DD
 * @returns {Promise<Array>} - Array di ordini attivi
 * @throws {Error} - Se fetch fallisce o response non ok
 */
export async function fetchActiveOrders(date) {
    if (!date) {
        throw new Error('[OrdersAPI] fetchActiveOrders: date is required');
    }

    console.log(`[OrdersAPI] Fetching /api/orders?date=${date}...`);

    try {
        const response = await fetch(`/api/orders?date=${date}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[OrdersAPI] Active orders fetched for ${date}:`, data.orders?.length || 0);
        
        return data.orders || [];
    } catch (error) {
        console.error(`[OrdersAPI] Failed to fetch active orders for ${date}:`, error);
        throw error;
    }
}

/**
 * Fetch storico ordini recenti
 * 
 * ENDPOINT: GET /api/orders/recent
 * 
 * RESPONSE: {
 *   orders: [
 *     {
 *       id: 42,
 *       status: "picked_up",
 *       date: "2026-01-15",
 *       time_slot: "11:30",
 *       is_modifiable: false,
 *       ingredients: [{ id: 1, name: "Sourdough" }, ...],
 *       ingredient_configuration_id: 99,
 *       is_favorite: false
 *     },
 *     ...
 *   ]
 * }
 * 
 * @returns {Promise<Array>} - Array di ordini recenti
 * @throws {Error} - Se fetch fallisce o response non ok
 */
export async function fetchRecentOrders() {
    console.log('[OrdersAPI] Fetching /api/orders/recent...');

    try {
        const response = await fetch('/api/orders/recent', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[OrdersAPI] Recent orders fetched:', data.orders?.length || 0);
        
        return data.orders || [];
    } catch (error) {
        console.error('[OrdersAPI] Failed to fetch recent orders:', error);
        throw error;
    }
}

/**
 * Fetch dati iniziali per la pagina Orders
 * 
 * ENDPOINT: GET /api/orders/init?date=YYYY-MM-DD
 * 
 * Query params:
 * - date: YYYY-MM-DD (opzionale, default: oggi sul backend)
 * 
 * RESPONSE: {
 *   user: { authenticated, enabled, name },
 *   scheduler: { selectedDayId, monthLabel, weekDays },
 *   activeOrders: [...],
 *   recentOrders: [...]
 * }
 * 
 * @param {string} date - Data nel formato YYYY-MM-DD (opzionale)
 * @returns {Promise<Object>} - Dati iniziali completi
 * @throws {Error} - Se fetch fallisce o response non ok
 */
export async function fetchOrdersPageData(date = null) {
    const url = date 
        ? `/api/orders/init?date=${date}` 
        : '/api/orders/init';
    
    console.log(`[OrdersAPI] Fetching ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[OrdersAPI] Orders page data fetched successfully');
        
        return data;
    } catch (error) {
        console.error('[OrdersAPI] Failed to fetch orders page data:', error);
        throw error;
    }
}

/**
 * Toggle preferito per una configurazione ingredienti
 * 
 * ENDPOINT: POST /api/favorites/toggle
 * 
 * BODY: {
 *   ingredient_configuration_id: 123
 * }
 * 
 * RESPONSE: {
 *   success: true,
 *   is_favorite: true | false
 * }
 * 
 * @param {number} configId - ID della configurazione ingredienti
 * @returns {Promise<Object>} - { success: boolean, is_favorite: boolean }
 * @throws {Error} - Se fetch fallisce o response non ok
 */
export async function toggleFavorite(configId) {
    if (!configId) {
        throw new Error('[OrdersAPI] toggleFavorite: configId is required');
    }

    console.log(`[OrdersAPI] Toggling favorite for config ${configId}...`);

    try {
        // Ottieni CSRF token da meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        if (!csrfToken) {
            console.warn('[OrdersAPI] CSRF token not found');
        }

        const response = await fetch('/api/favorites/toggle', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken || '',
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                ingredient_configuration_id: configId,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[OrdersAPI] Favorite toggled for config ${configId}:`, data.is_favorite);
        
        return data;
    } catch (error) {
        console.error(`[OrdersAPI] Failed to toggle favorite for config ${configId}:`, error);
        throw error;
    }
}

/**
 * Export default per import aggregato
 */
export default {
    fetchActiveOrders,
    fetchRecentOrders,
    fetchOrdersPageData,
    toggleFavorite,
};
