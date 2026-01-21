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
 * Rimuove ingrediente dalla selezione
 * 
 * PRINCIPIO SSOT (Single Source of Truth):
 * - Lo STATE è l'UNICA fonte di verità
 * - La UI NON decide mai se un ingrediente è selezionato
 * - La UI riflette SEMPRE e SOLO lo stato
 * 
 * Quando un ingrediente viene rimosso:
 * 1. Viene eliminato dall'array selectedIngredients
 * 2. La UI viene aggiornata tramite render (NON manipolazione diretta DOM)
 * 3. Sia "Your Selection" che "Add Ingredients" si sincronizzano automaticamente
 *    perché leggono dallo stesso stato
 * 
 * @param {number} ingredientId - ID ingrediente da rimuovere
 */
export function removeIngredient(ingredientId) {
    // SSOT: Rimuovi dall'unica struttura dati che rappresenta la selezione
    const idToRemove = Number(ingredientId);
    orderFormState.order.selectedIngredients = orderFormState.order.selectedIngredients.filter(
        i => Number(i.id) !== idToRemove
    );

    console.log(`[State] Ingredient ${idToRemove} removed. Remaining: ${orderFormState.order.selectedIngredients.length}`);
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

/**
 * FUNZIONE ATOMICA: Reset e applica selezione iniziale.
 * 
 * Usata sia da REORDER che da MODIFY per garantire SSOT.
 * 
 * REGOLE:
 * - Reset TOTALE della selezione (atomico)
 * - Usa Set per deduplica automatica
 * - Nessun merge con stato precedente
 * 
 * @param {Array<{id, name, category}>} ingredients - Ingredienti da selezionare
 */
export function resetAndApplySelection(ingredients) {
    console.log('[State] resetAndApplySelection called with:', ingredients?.length || 0, 'ingredients');
    
    // 1. RESET TOTALE (atomico)
    orderFormState.order.selectedIngredients = [];
    
    if (!ingredients || !Array.isArray(ingredients)) {
        console.warn('[State] resetAndApplySelection: No ingredients provided');
        return;
    }
    
    // 2. Deduplica usando Set di ID
    const seenIds = new Set();
    const deduplicatedIngredients = [];
    
    for (const ing of ingredients) {
        if (!ing || typeof ing.id === 'undefined') {
            console.warn('[State] Skipping invalid ingredient:', ing);
            continue;
        }

        const numericId = Number(ing.id);

        if (seenIds.has(numericId)) {
            console.warn('[State] Skipping duplicate ingredient ID:', numericId, ing.name);
            continue;
        }

        seenIds.add(numericId);
        deduplicatedIngredients.push({
            id: numericId,
            name: ing.name,
            category: ing.category,
        });
    }
    
    // 3. Applica in modo atomico
    orderFormState.order.selectedIngredients = deduplicatedIngredients;
    
    // 4. Debug: verifica invarianti
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
    
    console.log('[State] Selection validated:', {
        totalCount: selected.length,
        uniqueIdCount: uniqueIds.size,
        breadCount: breads.length,
        categories: [...new Set(selected.map(i => i.category))],
    });
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
