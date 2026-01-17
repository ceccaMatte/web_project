/**
 * ORDER FORM STATE - Single Source of Truth
 * 
 * RESPONSABILITÀ:
 * - Definisce struttura orderFormState (SOLO dati, MAI riferimenti DOM)
 * - Fornisce helper per mutation sicure dello stato
 * 
 * ARCHITETTURA:
 * - Centralizza lo stato della pagina Order Form
 * - Esportato e importato da order-form/index.js, *.hydration.js, *.actions.js
 * - I componenti NON importano questo modulo (ricevono props)
 * 
 * NOTA:
 * - CREATE e MODIFY condividono lo stesso state
 * - La differenza è nel campo 'mode' e nei dati iniziali
 */

/**
 * STATO GLOBALE PAGINA ORDER FORM (SSOT)
 * 
 * Contiene SOLO dati primitivi e serializzabili.
 * MAI riferimenti DOM, funzioni, o oggetti complessi.
 */
export const orderFormState = {
    // =========================================================================
    // UI STATE
    // =========================================================================
    
    /**
     * Stato UI
     * - isLoading: true durante caricamento iniziale
     * - isSubmitting: true durante submit
     */
    ui: {
        isLoading: true,
        isSubmitting: false,
    },

    /**
     * Modalità pagina: 'create' | 'modify'
     */
    mode: 'create',

    // =========================================================================
    // USER STATE
    // =========================================================================
    
    /**
     * User state
     * - authenticated: boolean
     * - name: string|null
     */
    user: {
        authenticated: false,
        name: null,
    },

    /**
     * Sidebar state
     */
    sidebarOpen: false,

    // =========================================================================
    // ORDER DATA
    // =========================================================================
    
    /**
     * Dati ordine corrente
     * - id: number|null (solo in modify)
     * - selectedDay: string (YYYY-MM-DD)
     * - selectedTimeSlotId: number|null (solo in create)
     * - selectedIngredients: Array<{id, name, category}>
     */
    order: {
        id: null,
        selectedDay: null,
        selectedTimeSlotId: null,
        selectedIngredients: [],
    },

    // =========================================================================
    // AVAILABILITY DATA (dal backend)
    // =========================================================================
    
    /**
     * Disponibilità ingredienti e time slots
     * - ingredients: Array raggruppati per categoria
     * - timeSlots: Array di slot disponibili (solo create)
     */
    availability: {
        ingredients: [],
        timeSlots: [],
    },

    // =========================================================================
    // ACCORDION STATE
    // =========================================================================
    
    /**
     * ID della sezione ingredienti aperta
     * null se tutte chiuse
     * Solo UNA sezione può essere aperta alla volta
     */
    openSectionId: null,

    // =========================================================================
    // SCHEDULER STATE (solo create)
    // =========================================================================
    
    /**
     * Scheduler state (come Home/Orders)
     */
    monthLabel: null,
    weekDays: [],
    selectedDayId: null,
};

// =============================================================================
// MUTATION HELPERS
// =============================================================================

/**
 * Aggiorna stato UI
 */
export function mutateUI(updates) {
    Object.assign(orderFormState.ui, updates);
}

/**
 * Aggiorna user state
 */
export function mutateUser(updates) {
    Object.assign(orderFormState.user, updates);
}

/**
 * Aggiorna sidebar state
 */
export function mutateSidebar(open) {
    orderFormState.sidebarOpen = open;
}

/**
 * Aggiorna mode
 */
export function mutateMode(mode) {
    orderFormState.mode = mode;
}

/**
 * Aggiorna order data
 */
export function mutateOrder(updates) {
    Object.assign(orderFormState.order, updates);
}

/**
 * Aggiorna availability
 */
export function mutateAvailability(updates) {
    Object.assign(orderFormState.availability, updates);
}

/**
 * Aggiorna openSectionId
 */
export function mutateOpenSection(sectionId) {
    orderFormState.openSectionId = sectionId;
}

/**
 * Aggiorna scheduler state
 */
export function mutateScheduler(updates) {
    if (updates.monthLabel !== undefined) orderFormState.monthLabel = updates.monthLabel;
    if (updates.weekDays !== undefined) orderFormState.weekDays = updates.weekDays;
    if (updates.selectedDayId !== undefined) orderFormState.selectedDayId = updates.selectedDayId;
}

/**
 * Aggiorna selectedDayId
 */
export function mutateSelectedDay(dayId) {
    orderFormState.selectedDayId = dayId;
    orderFormState.order.selectedDay = dayId;
    
    // Aggiorna isSelected nei weekDays
    orderFormState.weekDays = orderFormState.weekDays.map(day => ({
        ...day,
        isSelected: day.id === dayId,
    }));
}

/**
 * Aggiorna selectedTimeSlotId
 */
export function mutateSelectedTimeSlot(slotId) {
    orderFormState.order.selectedTimeSlotId = slotId;
}

/**
 * Aggiunge ingrediente alla selezione
 */
export function addIngredient(ingredient) {
    const { id, name, category } = ingredient;
    
    // Se categoria bread, rimuovi eventuale pane precedente
    if (category === 'bread') {
        orderFormState.order.selectedIngredients = orderFormState.order.selectedIngredients.filter(
            i => i.category !== 'bread'
        );
    }
    
    // Aggiungi se non già presente
    const exists = orderFormState.order.selectedIngredients.some(i => i.id === id);
    if (!exists) {
        orderFormState.order.selectedIngredients.push({ id, name, category });
    }
}

/**
 * Rimuove ingrediente dalla selezione
 */
export function removeIngredient(ingredientId) {
    orderFormState.order.selectedIngredients = orderFormState.order.selectedIngredients.filter(
        i => i.id !== ingredientId
    );
}

/**
 * Toggle ingrediente (add/remove)
 */
export function toggleIngredient(ingredient) {
    const exists = orderFormState.order.selectedIngredients.some(i => i.id === ingredient.id);
    
    if (exists) {
        removeIngredient(ingredient.id);
    } else {
        addIngredient(ingredient);
    }
}

/**
 * Verifica se un ingrediente è selezionato
 */
export function isIngredientSelected(ingredientId) {
    return orderFormState.order.selectedIngredients.some(i => i.id === ingredientId);
}

/**
 * Verifica se l'ordine è valido per submit
 * 
 * CREATE: richiede almeno 1 bread + 1 slot selezionato
 * MODIFY: richiede almeno 1 bread
 */
export function isOrderValid() {
    const hasBread = orderFormState.order.selectedIngredients.some(i => i.category === 'bread');
    
    if (orderFormState.mode === 'create') {
        const hasSlot = orderFormState.order.selectedTimeSlotId !== null;
        return hasBread && hasSlot;
    }
    
    // Modify: solo bread richiesto
    return hasBread;
}

/**
 * Reset completo dello state
 */
export function resetState() {
    orderFormState.ui = { isLoading: true, isSubmitting: false };
    orderFormState.mode = 'create';
    orderFormState.user = { authenticated: false, name: null };
    orderFormState.sidebarOpen = false;
    orderFormState.order = {
        id: null,
        selectedDay: null,
        selectedTimeSlotId: null,
        selectedIngredients: [],
    };
    orderFormState.availability = { ingredients: [], timeSlots: [] };
    orderFormState.openSectionId = null;
    orderFormState.monthLabel = null;
    orderFormState.weekDays = [];
    orderFormState.selectedDayId = null;
}

export default orderFormState;
