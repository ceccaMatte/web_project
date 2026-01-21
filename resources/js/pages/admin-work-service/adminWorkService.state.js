// Single source of truth for admin work service state
export const workServiceState = {
    /**
     * User state
     * - authenticated: boolean
     * - name: string|null
     * - nickname: string|null
     * - role: string|null
     */
    user: {
        authenticated: false,
        name: null,
        nickname: null,
        role: null,
    },

    /**
     * Week Scheduler state
     * - selectedDayId: string|null - ID giorno selezionato (YYYY-MM-DD)
     * - monthLabel: string|null - label mese corrente
     * - weekDays: Array<Object> - 7 giorni con struttura standard
     */
    selectedDayId: null,
    monthLabel: null,
    weekDays: [],

    /**
     * Time Slots per il giorno selezionato
     * 
     * STRUTTURA TIME SLOT:
     * {
     *   id: number,
     *   start_time: string (HH:mm:ss),
     *   end_time: string (HH:mm:ss),
     *   counts: {
     *     pending: number,
     *     confirmed: number,
     *     ready: number,
     *     picked_up: number
     *   }
     * }
     */
    timeSlots: [],

    /**
     * Selected Time Slot ID
     * 
     * - number: specifico time slot
     * - 'all': mostra tutti gli slot
     * - null: nessuna selezione (default: 'all')
     */
    selectedTimeSlotId: 'all',

    /**
     * Current Time Slot ID (auto-selected on first load)
     * 
     * ID del time slot corrente in base all'orario.
     * Usato solo per auto-selezione iniziale.
     */
    currentTimeSlotId: null,

    /**
     * Orders per il giorno selezionato
     * 
     * STRUTTURA ORDINE:
     * {
     *   id: number,
     *   daily_number: number,
     *   status: 'pending' | 'confirmed' | 'ready' | 'picked_up',
     *   time_slot_id: number,
     *   time_slot: { start_time, end_time },
     *   user: { id, nickname },
     *   ingredients: { bread: [...], meat: [...], ... } // grouped by category
     * }
     * 
     * NOTA: ordini con status 'rejected' sono esclusi dalla pipeline.
     */
    orders: [],

    /**
     * Selected Order ID
     * 
     * ID dell'ordine selezionato per visualizzazione recap.
     * null = nessun ordine selezionato.
     */
    selectedOrderId: null,

    /**
     * Mobile Recap Expanded State
     * 
     * true = recap espanso, false = collassato
     */
    mobileRecapExpanded: false,

    /**
     * Desktop Recap Card Visibility
     * 
     * true = card visibile, false = card nascosta
     */
    recapCardVisible: true,

    /**
     * Desktop Recap Card Expanded State
     * 
     * true = card espansa (mostra dati), false = card collassata (solo header)
     */
    recapCardExpanded: true,

    /**
     * Selected Order Status for Visual Dropdown
     * 
     * Current status displayed in the dropdown (visual only)
     */
    selectedOrderStatus: null,

    /**
     * Status Dropdown Open State
     * 
     * true = dropdown aperto, false = dropdown chiuso
     */
    isStatusDropdownOpen: false,

    /**
     * Loading state
     */
    isLoading: true,

    /**
     * Polling state
     */
    isPolling: false,

    /**
     * Error state
     */
    error: null,

    /**
     * Flag per indicare se è il primo caricamento
     * (per auto-select time slot solo alla prima volta)
     */
    isFirstLoad: true,

    /**
     * Flag per indicare se l'utente sta interagendo con i time slot
     * (blocca interferenza del polling)
     */
    isUserInteracting: false,
};

// ============================================================================
// MUTATION HELPERS
// ============================================================================

/**
 * Aggiorna user state
 */
export function mutateUser(user) {
    Object.assign(workServiceState.user, user);
}

/**
 * Aggiorna scheduler state
 */
export function mutateScheduler({ selectedDayId, monthLabel, weekDays }) {
    if (selectedDayId !== undefined) workServiceState.selectedDayId = selectedDayId;
    if (monthLabel !== undefined) workServiceState.monthLabel = monthLabel;
    if (weekDays !== undefined) workServiceState.weekDays = weekDays;
}

/**
 * Seleziona un giorno diverso nello scheduler
 */
export function mutateSelectedDay(dayId) {
    // Aggiorna selectedDayId
    workServiceState.selectedDayId = dayId;
    
    // Aggiorna isSelected nei weekDays
    workServiceState.weekDays = workServiceState.weekDays.map(day => ({
        ...day,
        isSelected: day.id === dayId,
    }));

    // Reset time slot selection on day change
    workServiceState.selectedTimeSlotId = 'all';
    workServiceState.selectedOrderId = null;
}

/**
 * Aggiorna time slots
 */
export function mutateTimeSlots(timeSlots, currentTimeSlotId = null) {
    workServiceState.timeSlots = timeSlots || [];
    
    // Auto-select time slot SOLO al primo caricamento E se l'utente non sta interagendo
    if (workServiceState.isFirstLoad && currentTimeSlotId !== null && !workServiceState.isUserInteracting) {
        workServiceState.currentTimeSlotId = currentTimeSlotId;
        workServiceState.selectedTimeSlotId = currentTimeSlotId;
        workServiceState.isFirstLoad = false;
    } else if (workServiceState.isUserInteracting) {
    }
}

/**
 * Seleziona un time slot (IDEMPOTENTE)
 */
export function mutateSelectedTimeSlot(slotId) {
    // IDEMPOTENZA: Non fare nulla se lo slot è già selezionato
    if (workServiceState.selectedTimeSlotId === slotId) {
        return false;
    }
    
    workServiceState.selectedTimeSlotId = slotId;
    // Reset order selection when time slot changes
    workServiceState.selectedOrderId = null;
    return true;
}

/**
 * Aggiorna orders
 */
export function mutateOrders(orders) {
    workServiceState.orders = orders || [];
    
    // If selected order is no longer in the list, deselect it
    if (workServiceState.selectedOrderId) {
        const stillExists = orders?.some(o => o.id === workServiceState.selectedOrderId);
        if (!stillExists) {
            workServiceState.selectedOrderId = null;
        }
    }
}

/**
 * Seleziona un ordine
 */
export function mutateSelectedOrder(orderId) {
    workServiceState.selectedOrderId = orderId;
}

/**
 * Aggiorna stato di un ordine locale (optimistic update)
 */
export function mutateOrderStatus(orderId, newStatus) {
    const orderIndex = workServiceState.orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        workServiceState.orders[orderIndex] = {
            ...workServiceState.orders[orderIndex],
            status: newStatus,
        };
    }
}

/**
 * Aggiorna loading state
 */
export function mutateLoading(isLoading) {
    workServiceState.isLoading = isLoading;
}

/**
 * Aggiorna polling state
 */
export function mutatePolling(isPolling) {
    workServiceState.isPolling = isPolling;
}

/**
 * Aggiorna error state
 */
export function mutateError(error) {
    workServiceState.error = error;
}

/**
 * Setta flag user interaction (per bloccare polling interferenza)
 */
export function setUserInteracting(isInteracting) {
    workServiceState.isUserInteracting = isInteracting;
}

/**
 * Reset flag user interaction dopo timeout
 */
export function resetUserInteractionAfterDelay(delayMs = 3000) {
    setTimeout(() => {
        if (workServiceState.isUserInteracting) {
            workServiceState.isUserInteracting = false;
        }
    }, delayMs);
}

// ============================================================================
// DERIVED STATE (COMPUTED)
// ============================================================================

/**
 * Filtra ordini per time slot selezionato
 */
export function getFilteredOrders() {
    const { orders, selectedTimeSlotId } = workServiceState;
    
    if (selectedTimeSlotId === 'all' || selectedTimeSlotId === null) {
        return orders;
    }
    
    return orders.filter(order => order.time_slot_id === selectedTimeSlotId);
}

/**
 * Raggruppa ordini filtrati per status
 */
export function getOrdersByStatus() {
    const filtered = getFilteredOrders();
    
    return {
        confirmed: filtered.filter(o => o.status === 'confirmed'),
        ready: filtered.filter(o => o.status === 'ready'),
        picked_up: filtered.filter(o => o.status === 'picked_up'),
    };
}

/**
 * Ottiene ordine selezionato
 */
export function getSelectedOrder() {
    if (!workServiceState.selectedOrderId) return null;
    return workServiceState.orders.find(o => o.id === workServiceState.selectedOrderId) || null;
}

export default workServiceState;
