/**
 * HOME HYDRATION LAYER
 * 
 * RESPONSABILITÀ:
 * - Idratare homeState con dati da API
 * - Orchestrare fetch + mapping + render
 * - Gestire errori di caricamento
 * 
 * ARCHITETTURA:
 * - refreshHomeState(): fetch API, hydrate, render
 * - hydrateHomeState(): mapping 1:1 API → homeState
 * - No side effects DOM (solo state mutation)
 * 
 * UTILIZZO:
 * import { refreshHomeState, hydrateHomeState } from './home.hydration.js';
 * 
 * // All'init pagina:
 * await refreshHomeState();
 * 
 * // Solo hydrate (es. dopo modifica locale):
 * hydrateHomeState(apiData);
 */

import { homeState } from './home.state.js';
import { fetchHome } from './home.api.js';

/**
 * Refresh completo dello stato Home da API
 * 
 * WORKFLOW:
 * 1. Fetch /api/home
 * 2. Hydrate homeState con risposta
 * 3. Trigger render completo UI
 * 
 * IDEMPOTENTE: Può essere chiamata N volte (per polling futuro).
 * 
 * @returns {Promise<void>}
 */
export async function refreshHomeState() {
    console.log('[Hydration] Refreshing home state from API...');

    try {
        // 1. Fetch dati da API
        const data = await fetchHome();

        // 2. Hydrate state
        hydrateHomeState(data);

        // 3. Render UI (importato dinamicamente per evitare circular deps)
        const { renderHome } = await import('./home.render.js');
        renderHome();

        console.log('[Hydration] Home state refreshed and rendered successfully');
    } catch (error) {
        console.error('[Hydration] Failed to refresh home state:', error);
        
        // TODO: Mostrare messaggio errore all'utente
        // Per ora manteniamo stato precedente (graceful degradation)
    }
}

/**
 * Hydrate homeState con dati API
 * 
 * RESPONSABILITÀ:
 * - Mapping 1:1 tra response API e homeState
 * - Normalizzazione dati (fallback, type coercion)
 * - NO DOM manipulation, NO side effects
 * 
 * IMPORTANTE:
 * - Non fa render (responsabilità del chiamante)
 * - Non valida logica business (dati trusted da backend)
 * - Non fa fetch (riceve dati già fetchati)
 * 
 * @param {Object} data - Response completa da /api/home
 */
export function hydrateHomeState(data) {
    console.log('[Hydration] Hydrating home state with API data...');

    if (!data) {
        console.warn('[Hydration] Data is null or undefined, skipping hydration');
        return;
    }
    
    console.debug('[Hydration] Raw API data:', {
        user: data.user,
        ordersPreview: data.ordersPreview,
        bookingSlots: data.booking?.slots?.length || 0,
    });

    // User state
    if (data.user) {
        homeState.user = {
            authenticated: Boolean(data.user.authenticated),
            enabled: Boolean(data.user.enabled),
            name: data.user.name || null,
        };
        console.debug('[Hydration] User state updated:', homeState.user);
    }

    // Today Service state
    if (data.todayService) {
        homeState.todayService = {
            status: data.todayService.status || 'inactive',
            location: data.todayService.location || null,
            startTime: data.todayService.startTime || null,
            endTime: data.todayService.endTime || null,
            queueTime: data.todayService.queueTime !== null 
                ? Number(data.todayService.queueTime) 
                : null,
        };
    }

    // Scheduler state
    if (data.scheduler) {
        homeState.selectedDayId = data.scheduler.selectedDayId || null;
        homeState.selectedDate = data.scheduler.selectedDayId || null;  // Sincronizzazione
        homeState.monthLabel = data.scheduler.monthLabel || null;
        homeState.weekDays = Array.isArray(data.scheduler.weekDays) 
            ? data.scheduler.weekDays 
            : [];
    }

    // Orders Preview state
    if (data.ordersPreview) {
        homeState.ordersPreview = {
            variant: data.ordersPreview.variant || 'login-cta',
            ordersCount: Number(data.ordersPreview.ordersCount) || 0,
            selectedOrder: data.ordersPreview.selectedOrder || null,
        };
    }

    // Booking state
    if (data.booking) {
        homeState.booking = {
            dateLabel: data.booking.dateLabel || null,
            locationLabel: data.booking.locationLabel || null,
            slots: Array.isArray(data.booking.slots) 
                ? data.booking.slots 
                : [],
        };
    }

    console.log('[Hydration] Home state hydrated successfully');
    console.debug('[Hydration] Final state:', structuredClone({
        user: homeState.user,
        ordersPreview: homeState.ordersPreview,
        bookingSlotsCount: homeState.booking.slots.length,
    }));
}

/**
 * Export default per import aggregato
 */
export default {
    refreshHomeState,
    hydrateHomeState,
};
