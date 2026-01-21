// Orders state (SSOT)
export const ordersState = {
    /**
     * User state
     * - authenticated: boolean - se l'utente è loggato
     * - enabled: boolean - se l'utente è abilitato (account attivo)
     * - name: string|null - nome visualizzato (es. "Mario")
     */
    user: {
        authenticated: false,
        enabled: false,
        name: null,
    },

    /**
     * Sidebar state
     * - sidebarOpen: boolean - stato apertura sidebar
     */
    sidebarOpen: false,

    /**
     * Week Scheduler state
     * - selectedDayId: string|null - ID giorno selezionato (YYYY-MM-DD)
     * - monthLabel: string|null - label mese corrente (es. "January 2026")
     * - weekDays: Array<Object> - 7 giorni con struttura:
     *   {
     *     id: "2026-01-15",
     *     weekday: "WED",
     *     dayNumber: "15",
     *     isToday: boolean,
     *     isActive: boolean,
     *     isDisabled: boolean,
     *     isSelected: boolean
     *   }
     */
    selectedDayId: null,
    monthLabel: null,
    weekDays: [],

    /**
     * Active Orders per il giorno selezionato
     * 
     * STRUTTURA ORDINE:
     * {
     *   id: number,
     *   status: 'pending' | 'confirmed' | 'ready' | 'picked_up' | 'rejected',
     *   date: string (YYYY-MM-DD),
     *   time_slot: string (es. "11:30"),
     *   is_modifiable: boolean,
     *   ingredients: Array<{ id: number, name: string }>,
     *   ingredient_configuration_id: number,
     *   is_favorite: boolean
     * }
     */
    activeOrders: [],

    /**
     * Recent Orders (storico)
     * 
     * Stessa struttura di activeOrders ma ordini passati.
     * Ordinati per data decrescente dal backend.
     */
    recentOrders: [],

    /**
     * Expanded Order IDs
     * 
     * Array di order ID espansi (show more attivo).
     * Usato per decidere se mostrare tutti gli ingredienti o solo preview.
     */
    expandedOrderIds: [],

    /**
     * Filtro preferiti
     * 
     * Se true, mostra solo ordini con is_favorite = true
     * nella sezione Recently Ordered.
     */
    showOnlyFavorites: false,

    /**
     * Active Carousel Index
     * 
     * Indice dell'ordine attivo nel carousel (0-based).
     * Si resetta a 0 quando cambia giorno selezionato.
     */
    activeCarouselIndex: 0,

    /**
     * Loading state
     * 
     * Indica se stiamo fetchando dati.
     * Usato per mostrare skeleton/spinner.
     */
    loading: false,

    /**
     * Error state
     * 
     * Contiene eventuale messaggio di errore.
     * null se nessun errore.
     */
    error: null,
};

// ============================================================================
// MUTATION HELPERS
// ============================================================================

export function mutateUser(userData) {
    ordersState.user = { ...ordersState.user, ...userData };
}
export function mutateSidebar(isOpen) {
    ordersState.sidebarOpen = Boolean(isOpen);
}
export function mutateScheduler(schedulerData) {
    if (schedulerData.selectedDayId !== undefined) {
        ordersState.selectedDayId = schedulerData.selectedDayId;
    }
    if (schedulerData.monthLabel !== undefined) {
        ordersState.monthLabel = schedulerData.monthLabel;
    }
    if (schedulerData.weekDays !== undefined) {
        ordersState.weekDays = schedulerData.weekDays;
    }
}
export function mutateSelectedDay(dayId) {
    ordersState.selectedDayId = dayId;
    
    ordersState.weekDays = ordersState.weekDays.map(day => ({
        ...day,
        isSelected: day.id === dayId,
    }));
}
export function mutateActiveOrders(orders) {
    ordersState.activeOrders = Array.isArray(orders) ? orders : [];
}
export function mutateRecentOrders(orders) {
    ordersState.recentOrders = Array.isArray(orders) ? orders : [];
}
export function toggleExpandedOrder(orderId) {
    const index = ordersState.expandedOrderIds.indexOf(orderId);
    if (index === -1) {
        ordersState.expandedOrderIds = [...ordersState.expandedOrderIds, orderId];
    } else {
        ordersState.expandedOrderIds = ordersState.expandedOrderIds.filter(id => id !== orderId);
    }
}
export function toggleFavoritesFilter() {
    ordersState.showOnlyFavorites = !ordersState.showOnlyFavorites;
}
export function navigateCarousel(direction) {
    const count = ordersState.activeOrders.length;
    if (count <= 1) return;
    
    if (direction === 'next') {
        ordersState.activeCarouselIndex = (ordersState.activeCarouselIndex + 1) % count;
    } else if (direction === 'prev') {
        ordersState.activeCarouselIndex = (ordersState.activeCarouselIndex - 1 + count) % count;
    }
}

export function resetCarouselIndex() {
    ordersState.activeCarouselIndex = 0;
}
export function mutateOrderFavorite(orderId, isFavorite) {
    ordersState.activeOrders = ordersState.activeOrders.map(order => 
        order.id === orderId 
            ? { ...order, is_favorite: isFavorite }
            : order
    );
    
    ordersState.recentOrders = ordersState.recentOrders.map(order => 
        order.id === orderId 
            ? { ...order, is_favorite: isFavorite }
            : order
    );
}

export function mutateLoading(isLoading) {
    ordersState.loading = Boolean(isLoading);
}
export function mutateError(errorMessage) {
    ordersState.error = errorMessage;
}
export function resetOrdersState() {
    ordersState.user = { authenticated: false, enabled: false, name: null };
    ordersState.sidebarOpen = false;
    ordersState.selectedDayId = null;
    ordersState.monthLabel = null;
    ordersState.weekDays = [];
    ordersState.activeOrders = [];
    ordersState.recentOrders = [];
    ordersState.expandedOrderIds = [];
    ordersState.showOnlyFavorites = false;
    ordersState.activeCarouselIndex = 0;
    ordersState.loading = false;
    ordersState.error = null;
}

/**
 * Export default per import aggregato
 */
export default {
    ordersState,
    mutateUser,
    mutateSidebar,
    mutateScheduler,
    mutateSelectedDay,
    mutateActiveOrders,
    mutateRecentOrders,
    toggleExpandedOrder,
    toggleFavoritesFilter,
    navigateCarousel,
    resetCarouselIndex,
    mutateOrderFavorite,
    mutateLoading,
    mutateError,
    resetOrdersState,
};
