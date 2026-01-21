// Hydration helpers: fetch and map API data into `ordersState`

import { ordersState, mutateUser, mutateScheduler, mutateActiveOrders, mutateRecentOrders, mutateLoading, mutateError } from './orders.state.js';
import { fetchOrdersPageData } from './orders.api.js';

// Refresh orders state from API
export async function refreshOrdersState(date = null) {
    mutateLoading(true);
    mutateError(null);

    try {
        const data = await fetchOrdersPageData(date);
        hydrateOrdersState(data);
        mutateLoading(false);
        const { renderOrdersPage } = await import('./orders.render.js');
        renderOrdersPage();
    } catch (error) {
        console.error('Failed to refresh orders state:', error);
        mutateError('Failed to load orders. Please try again.');
        mutateLoading(false);
        const { renderOrdersPage } = await import('./orders.render.js');
        renderOrdersPage();
    }
}

// Map API response into ordersState (no side-effects)
export function hydrateOrdersState(data) {
    if (!data) {
        console.warn('hydrateOrdersState: no data');
        return;
    }

    if (data.user) {
        mutateUser({
            authenticated: Boolean(data.user.authenticated),
            enabled: Boolean(data.user.enabled),
            name: data.user.name || null,
        });
    }

    // preserve selectedDayId across refreshes
    if (data.scheduler) {
        const currentSelectedDayId = ordersState.selectedDayId;
        mutateScheduler({
            selectedDayId: currentSelectedDayId || data.scheduler.selectedDayId || null,
            monthLabel: data.scheduler.monthLabel || null,
            weekDays: Array.isArray(data.scheduler.weekDays) ? data.scheduler.weekDays : [],
        });
    }

    if (data.activeOrders) mutateActiveOrders(normalizeOrders(data.activeOrders));
    if (data.recentOrders) mutateRecentOrders(normalizeOrders(data.recentOrders));
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
        console.warn('Scheduler data is null, skipping');
        return;
    }

    mutateScheduler({
        selectedDayId: schedulerData.selectedDayId || null,
        monthLabel: schedulerData.monthLabel || null,
        weekDays: Array.isArray(schedulerData.weekDays) 
            ? schedulerData.weekDays 
            : [],
    });

    // scheduler hydrated from DOM
}

/**
 * Hydrate user state da dati inline
 * 
 * @param {Object} userData - Dati user da script tag
 */
export function hydrateUserFromDOM(userData) {
    if (!userData) {
        console.warn('User data is null, skipping');
        return;
    }

    mutateUser({
        authenticated: Boolean(userData.authenticated),
        enabled: Boolean(userData.enabled),
        name: userData.name || null,
    });

    // user hydrated from DOM
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
