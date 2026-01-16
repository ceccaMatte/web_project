/**
 * ORDERS ACTIONS LAYER
 * 
 * RESPONSABILITÀ:
 * - Gestisce azioni utente sulla pagina Orders
 * - Modifica ordersState in risposta ad eventi
 * - Trigger render mirati o completi
 * 
 * ARCHITETTURA:
 * - Ogni action è una funzione che modifica state + rende
 * - Importato da componenti come callbacks
 * - Può chiamare API per fetch dati aggiuntivi
 * 
 * UTILIZZO:
 * import { selectDay, toggleExpand, navigateToCreate } from './orders.actions.js';
 * 
 * // Da component callback:
 * onDaySelected: (dayId) => selectDay(dayId)
 */

import { ordersState, mutateSidebar, mutateSelectedDay, mutateActiveOrders, toggleExpandedOrder, toggleFavoritesFilter, mutateOrderFavorite, navigateCarousel, resetCarouselIndex } from './orders.state.js';
import { ordersView } from './orders.view.js';
import { fetchActiveOrders, toggleFavorite as toggleFavoriteApi } from './orders.api.js';

// ============================================================================
// SIDEBAR ACTIONS
// ============================================================================

/**
 * Apri sidebar
 * 
 * WORKFLOW:
 * 1. Aggiorna ordersState.sidebarOpen = true
 * 2. Re-render sidebar + topbar
 */
export function openSidebar() {
    console.log('[Actions] Opening sidebar');
    
    mutateSidebar(true);
    
    // Re-render immediato
    import('./orders.render.js').then(({ renderSidebarAndTopbar }) => {
        renderSidebarAndTopbar();
    });
}

/**
 * Chiudi sidebar
 * 
 * WORKFLOW:
 * 1. Aggiorna ordersState.sidebarOpen = false
 * 2. Re-render sidebar + topbar
 */
export function closeSidebar() {
    console.log('[Actions] Closing sidebar');
    
    mutateSidebar(false);
    
    // Re-render immediato
    import('./orders.render.js').then(({ renderSidebarAndTopbar }) => {
        renderSidebarAndTopbar();
    });
}

// ============================================================================
// SCHEDULER ACTIONS
// ============================================================================

/**
 * Seleziona giorno nello scheduler
 * 
 * WORKFLOW:
 * 1. Aggiorna ordersState.selectedDayId
 * 2. Aggiorna weekDays.isSelected
 * 3. Reset carousel index a 0
 * 4. Fetch ordini attivi per quel giorno da API
 * 5. Aggiorna ordersState.activeOrders
 * 6. Re-render scheduler + active orders
 * 
 * @param {string} dayId - ID giorno (YYYY-MM-DD)
 */
export async function selectDay(dayId) {
    console.log(`[Actions] Selecting day: ${dayId}`);
    
    if (!dayId) {
        console.warn('[Actions] selectDay: dayId is required');
        return;
    }

    // 1. Aggiorna state (feedback visivo immediato)
    mutateSelectedDay(dayId);
    
    // 2. Reset carousel index quando cambia giorno
    resetCarouselIndex();

    // 3. Re-render scheduler (immediato per feedback visivo)
    const { renderScheduler } = await import('./orders.render.js');
    renderScheduler();

    // 4. Fetch ordini attivi per il giorno selezionato
    try {
        console.debug(`[Actions] Fetching active orders for ${dayId}...`);
        const activeOrders = await fetchActiveOrders(dayId);
        
        // 5. Aggiorna state
        mutateActiveOrders(activeOrders);
        
        // 6. Re-render active orders section
        const { renderActiveOrdersSection } = await import('./orders.render.js');
        renderActiveOrdersSection();
        
    } catch (error) {
        console.error('[Actions] Failed to fetch active orders:', error);
        // Mostra empty state in caso di errore
        mutateActiveOrders([]);
        const { renderActiveOrdersSection } = await import('./orders.render.js');
        renderActiveOrdersSection();
    }
}

// ============================================================================
// CAROUSEL ACTIONS
// ============================================================================

/**
 * Naviga nel carousel degli ordini attivi
 * 
 * @param {'prev' | 'next'} direction - Direzione navigazione
 */
export function navigateActiveOrdersCarousel(direction) {
    console.log(`[Actions] Navigate carousel: ${direction}`);
    
    navigateCarousel(direction);
    
    import('./orders.render.js').then(({ renderActiveOrdersSection }) => {
        renderActiveOrdersSection();
    });
}

// ============================================================================
// ORDER CARD ACTIONS
// ============================================================================

/**
 * Toggle espansione card ordine (show more / show less)
 * 
 * WORKFLOW:
 * 1. Toggle orderId in expandedOrderIds
 * 2. Re-render solo la card interessata
 * 
 * @param {number} orderId - ID dell'ordine da espandere/collassare
 */
export function toggleOrderExpand(orderId) {
    console.log(`[Actions] Toggle expand for order: ${orderId}`);
    
    toggleExpandedOrder(orderId);
    
    // Re-render sections che contengono ordini
    import('./orders.render.js').then(({ renderActiveOrdersSection, renderRecentOrdersSection }) => {
        renderActiveOrdersSection();
        renderRecentOrdersSection();
    });
}

/**
 * Toggle preferito per un ordine
 * 
 * WORKFLOW:
 * 1. Chiama API per toggle preferito
 * 2. Aggiorna ordersState con nuovo stato
 * 3. Re-render card interessata
 * 
 * @param {number} orderId - ID dell'ordine
 * @param {number} configId - ID della configurazione ingredienti
 */
export async function toggleOrderFavorite(orderId, configId) {
    console.log(`[Actions] Toggle favorite for order: ${orderId}, config: ${configId}`);
    
    if (!configId) {
        console.warn('[Actions] toggleOrderFavorite: configId is required');
        return;
    }

    try {
        // 1. Chiama API
        const result = await toggleFavoriteApi(configId);
        
        // 2. Aggiorna state
        mutateOrderFavorite(orderId, result.is_favorite);
        
        // 3. Re-render
        import('./orders.render.js').then(({ renderActiveOrdersSection, renderRecentOrdersSection }) => {
            renderActiveOrdersSection();
            renderRecentOrdersSection();
        });
        
    } catch (error) {
        console.error('[Actions] Failed to toggle favorite:', error);
        // TODO: Mostrare messaggio errore all'utente
    }
}

/**
 * Toggle filtro preferiti nella sezione Recent Orders
 * 
 * WORKFLOW:
 * 1. Toggle ordersState.showOnlyFavorites
 * 2. Re-render sezione recent orders
 */
export function toggleFavoritesOnly() {
    console.log('[Actions] Toggle favorites filter');
    
    toggleFavoritesFilter();
    
    import('./orders.render.js').then(({ renderRecentOrdersSection }) => {
        renderRecentOrdersSection();
    });
}

// ============================================================================
// NAVIGATION ACTIONS
// ============================================================================

/**
 * Naviga alla pagina di creazione ordine
 * 
 * @param {number|null} configId - ID configurazione ingredienti (opzionale, per reorder)
 */
export function navigateToCreate(configId = null) {
    console.log('[Actions] Navigate to create order');
    
    // Per ora naviga senza parametri
    // In futuro: /orders/create?config=${configId}
    window.location.href = '/orders/create';
}

/**
 * Naviga alla pagina di modifica ordine
 * 
 * @param {number} orderId - ID dell'ordine da modificare
 */
export function navigateToModify(orderId) {
    console.log(`[Actions] Navigate to modify order: ${orderId}`);
    
    if (!orderId) {
        console.warn('[Actions] navigateToModify: orderId is required');
        return;
    }
    
    window.location.href = `/orders/${orderId}/edit`;
}

/**
 * Torna alla Home page
 */
export function goBack() {
    console.log('[Actions] Navigate back to home');
    
    window.location.href = '/';
}

/**
 * Reorder: naviga a create con configurazione ingredienti precompilata
 * 
 * @param {number} configId - ID della configurazione ingredienti da replicare
 */
export function reorder(configId) {
    console.log(`[Actions] Reorder with config: ${configId}`);
    
    // Per ora naviga solo a create
    // In futuro passerà la configurazione
    navigateToCreate(configId);
}

/**
 * Export default per import aggregato
 */
export default {
    openSidebar,
    closeSidebar,
    selectDay,
    navigateActiveOrdersCarousel,
    toggleOrderExpand,
    toggleOrderFavorite,
    toggleFavoritesOnly,
    navigateToCreate,
    navigateToModify,
    goBack,
    reorder,
};
