/**
 * ORDERS HYDRATION LAYER
 * 
 * RESPONSABILITÀ:
 * - Idratare ordersState con dati da API
 * - Orchestrare fetch + mapping + render
 * - Gestire errori di caricamento
 * 
 * ARCHITETTURA:
 * - refreshOrdersState(): fetch API, hydrate, render
 * - hydrateOrdersState(): mapping 1:1 API → ordersState
 * - No side effects DOM (solo state mutation)
 * 
 * UTILIZZO:
 * import { refreshOrdersState, hydrateOrdersState } from './orders.hydration.js';
 * 
 * // All'init pagina:
 * await refreshOrdersState();
 * 
 * // Solo hydrate (es. dopo modifica locale):
 * hydrateOrdersState(apiData);
 */

import { ordersState, mutateUser, mutateScheduler, mutateActiveOrders, mutateRecentOrders, mutateLoading, mutateError } from './orders.state.js';
import { fetchOrdersPageData } from './orders.api.js';

/**
 * Refresh completo dello stato Orders da API
 * 
 * WORKFLOW:
 * 1. Set loading = true
 * 2. Fetch /api/orders/init
 * 3. Hydrate ordersState con risposta
 * 4. Set loading = false
 * 5. Trigger render completo UI
 * 
 * IDEMPOTENTE: Può essere chiamata N volte.
 * 
 * @returns {Promise<void>}
 */
export async function refreshOrdersState() {
    console.log('[Hydration] Refreshing orders state from API...');

    mutateLoading(true);
    mutateError(null);

    try {
        // 1. Fetch dati da API
        const data = await fetchOrdersPageData();

        // 2. Hydrate state
        hydrateOrdersState(data);

        // 3. SPEGNI LOADER PRIMA DEL RENDER
        mutateLoading(false);

        // 4. Render UI (importato dinamicamente per evitare circular deps)
        const { renderOrdersPage } = await import('./orders.render.js');
        renderOrdersPage();

        console.log('[Hydration] Orders state refreshed and rendered successfully');
    } catch (error) {
        console.error('[Hydration] Failed to refresh orders state:', error);
        mutateError('Failed to load orders. Please try again.');
        
        // Spegni loader anche in caso di errore
        mutateLoading(false);
        
        // Render comunque per mostrare errore
        const { renderOrdersPage } = await import('./orders.render.js');
        renderOrdersPage();
    }
}

/**
 * Hydrate ordersState con dati API
 * 
 * RESPONSABILITÀ:
 * - Mapping 1:1 tra response API e ordersState
 * - Normalizzazione dati (fallback, type coercion)
 * - NO DOM manipulation, NO side effects
 * 
 * IMPORTANTE:
 * - Non fa render (responsabilità del chiamante)
 * - Non valida logica business (dati trusted da backend)
 * - Non fa fetch (riceve dati già fetchati)
 * 
 * @param {Object} data - Response completa da /api/orders/init
 */
export function hydrateOrdersState(data) {
    console.log('[Hydration] Hydrating orders state with API data...');

    if (!data) {
        console.warn('[Hydration] Data is null or undefined, skipping hydration');
        return;
    }
    
    console.debug('[Hydration] Raw API data:', {
        user: data.user,
        activeOrdersCount: data.activeOrders?.length || 0,
        recentOrdersCount: data.recentOrders?.length || 0,
    });

    // User state
    if (data.user) {
        mutateUser({
            authenticated: Boolean(data.user.authenticated),
            enabled: Boolean(data.user.enabled),
            name: data.user.name || null,
        });
        console.debug('[Hydration] User state updated:', ordersState.user);
    }

    // Scheduler state
    if (data.scheduler) {
        mutateScheduler({
            selectedDayId: data.scheduler.selectedDayId || null,
            monthLabel: data.scheduler.monthLabel || null,
            weekDays: Array.isArray(data.scheduler.weekDays) 
                ? data.scheduler.weekDays 
                : [],
        });
        console.debug('[Hydration] Scheduler state updated');
    }

    // Active Orders
    if (data.activeOrders) {
        mutateActiveOrders(normalizeOrders(data.activeOrders));
        console.debug('[Hydration] Active orders updated:', ordersState.activeOrders.length);
    }

    // Recent Orders
    if (data.recentOrders) {
        mutateRecentOrders(normalizeOrders(data.recentOrders));
        console.debug('[Hydration] Recent orders updated:', ordersState.recentOrders.length);
    }

    console.log('[Hydration] Orders state hydrated successfully');
}

/**
 * Normalizza array di ordini
 * 
 * Assicura che ogni ordine abbia tutti i campi richiesti con valori di default.
 * 
 * @param {Array} orders - Array grezzo di ordini
 * @returns {Array} - Array normalizzato
 */
function normalizeOrders(orders) {
    if (!Array.isArray(orders)) {
        return [];
    }

    return orders.map(order => ({
        id: order.id || 0,
        status: order.status || 'pending',
        date: order.date || null,
        time_slot: order.time_slot || null,
        is_modifiable: Boolean(order.is_modifiable),
        ingredients: Array.isArray(order.ingredients) ? order.ingredients : [],
        ingredient_configuration_id: order.ingredient_configuration_id || null,
        is_favorite: Boolean(order.is_favorite),
        // Campi opzionali per display
        order_number: order.order_number || order.daily_number || null,
        image_url: order.image_url || null,
    }));
}

/**
 * Hydrate solo scheduler da dati inline (per initial render veloce)
 * 
 * Usato quando i dati scheduler sono già nel DOM (via Blade).
 * 
 * @param {Object} schedulerData - Dati scheduler da script tag
 */
export function hydrateSchedulerFromDOM(schedulerData) {
    if (!schedulerData) {
        console.warn('[Hydration] Scheduler data is null, skipping');
        return;
    }

    mutateScheduler({
        selectedDayId: schedulerData.selectedDayId || null,
        monthLabel: schedulerData.monthLabel || null,
        weekDays: Array.isArray(schedulerData.weekDays) 
            ? schedulerData.weekDays 
            : [],
    });

    console.log('[Hydration] Scheduler hydrated from DOM');
}

/**
 * Hydrate user state da dati inline
 * 
 * @param {Object} userData - Dati user da script tag
 */
export function hydrateUserFromDOM(userData) {
    if (!userData) {
        console.warn('[Hydration] User data is null, skipping');
        return;
    }

    mutateUser({
        authenticated: Boolean(userData.authenticated),
        enabled: Boolean(userData.enabled),
        name: userData.name || null,
    });

    console.log('[Hydration] User hydrated from DOM');
}

/**
 * Export default per import aggregato
 */
export default {
    refreshOrdersState,
    hydrateOrdersState,
    hydrateSchedulerFromDOM,
    hydrateUserFromDOM,
};
