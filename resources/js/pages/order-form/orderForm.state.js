// Single source of truth for order form state
export const orderFormState = {
    // UI
    ui: { isLoading: true, isSubmitting: false },
    // Mode: 'create' | 'modify'
    mode: 'create',
    // User
    user: { authenticated: false, name: null },
    sidebarOpen: false,
    // Order data
    order: { id: null, selectedDay: null, selectedTimeSlotId: null, selectedIngredients: [] },
    // Backend-provided availability
    availability: { ingredients: [], timeSlots: [] },
    // Accordion / scheduler
    openSectionId: null,
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
    // Normalizziamo l'ID su Number per evitare mismatch string/number
    const id = Number(ingredient.id);
    const name = ingredient.name;
    const category = ingredient.category;
    
    // Se categoria bread, rimuovi eventuale pane precedente
    if (category === 'bread') {
        orderFormState.order.selectedIngredients = orderFormState.order.selectedIngredients.filter(
            i => i.category !== 'bread'
        );
    }
    
    // Aggiungi se non già presente
    const exists = orderFormState.order.selectedIngredients.some(i => Number(i.id) === id);
    if (!exists) {
        orderFormState.order.selectedIngredients.push({ id, name, category });
    }
}

/**
 * Remove ingredient from selection
 * @param {number} ingredientId
 */
export function removeIngredient(ingredientId) {
    // SSOT: Rimuovi dall'unica struttura dati che rappresenta la selezione
    const idToRemove = Number(ingredientId);
    orderFormState.order.selectedIngredients = orderFormState.order.selectedIngredients.filter(
        i => Number(i.id) !== idToRemove
    );
}

/**
 * Toggle ingrediente (add/remove)
 */
export function toggleIngredient(ingredient) {
    const id = Number(ingredient.id);
    const exists = orderFormState.order.selectedIngredients.some(i => Number(i.id) === id);

    if (exists) {
        removeIngredient(id);
    } else {
        addIngredient({ id, name: ingredient.name, category: ingredient.category });
    }
}

/**
 * Verifica se un ingrediente è selezionato
 */
export function isIngredientSelected(ingredientId) {
    return orderFormState.order.selectedIngredients.some(i => Number(i.id) === Number(ingredientId));
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

// Reset selection and apply a provided list (atomic, deduplicated)
export function resetAndApplySelection(ingredients) {
    orderFormState.order.selectedIngredients = [];

    if (!ingredients || !Array.isArray(ingredients)) {
        console.warn('resetAndApplySelection: no ingredients provided');
        return;
    }

    const seenIds = new Set();
    const deduplicatedIngredients = [];

    for (const ing of ingredients) {
        if (!ing || typeof ing.id === 'undefined') {
            console.warn('Skipping invalid ingredient:', ing);
            continue;
        }

        const numericId = Number(ing.id);
        if (seenIds.has(numericId)) {
            continue;
        }

        seenIds.add(numericId);
        deduplicatedIngredients.push({ id: numericId, name: ing.name, category: ing.category });
    }

    orderFormState.order.selectedIngredients = deduplicatedIngredients;
    validateSelectionInvariants();
}

/**
 * Valida invarianti della selezione (debug).
 * 
 * Logga errori se lo stato è inconsistente.
 */
function validateSelectionInvariants() {
    const selected = orderFormState.order.selectedIngredients;
    
    // Check: nessun duplicato
    const ids = selected.map(i => i.id);
    const uniqueIds = new Set(ids);
    
    if (ids.length !== uniqueIds.size) {
        console.error('[State] INVARIANT VIOLATION: Duplicate IDs in selectedIngredients!', ids);
    }
    
    // Check: massimo 1 bread
    const breads = selected.filter(i => i.category === 'bread');
    if (breads.length > 1) {
        console.error('[State] INVARIANT VIOLATION: Multiple breads selected!', breads);
    }
    
    // validation logged above if any invariant violated
}

/**
 * Deriva gli IDs selezionati (per passare ai componenti).
 * 
 * Questa è una funzione DERIVATA, non modifica lo stato.
 * 
 * @returns {number[]} Array di IDs ingredienti selezionati
 */
export function deriveSelectedIds() {
    return orderFormState.order.selectedIngredients.map(i => Number(i.id));
}

export default orderFormState;
