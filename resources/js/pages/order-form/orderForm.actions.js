/**
 * ORDER FORM ACTIONS - Business Logic & Event Handlers
 * 
 * RESPONSABILITÀ:
 * - Gestire azioni utente (selezioni, submit, navigazione)
 * - Modificare state in risposta ad eventi
 * - Trigger render mirati
 * 
 * ARCHITETTURA:
 * - Ogni action modifica state e triggera render
 * - I componenti chiamano actions tramite callbacks
 * - Le actions possono chiamare API
 */

import { 
    orderFormState, 
    mutateSidebar, 
    mutateOpenSection, 
    mutateSelectedDay,
    mutateSelectedTimeSlot,
    toggleIngredient,
    removeIngredient,
    isOrderValid,
    mutateUI,
    mutateOrder,
    mutateAvailability,
} from './orderForm.state.js';

import { 
    createOrder, 
    updateOrder, 
    deleteOrder,
    fetchAvailability,
} from './orderForm.api.js';

import { renderOrderFormPage } from './orderForm.render.js';
import { orderFormView } from './orderForm.view.js';

// =============================================================================
// SIDEBAR ACTIONS
// =============================================================================

/**
 * Apri sidebar
 */
export function openSidebar() {
    console.log('[Actions] Opening sidebar');
    mutateSidebar(true);
    renderOrderFormPage();
}

/**
 * Chiudi sidebar
 */
export function closeSidebar() {
    console.log('[Actions] Closing sidebar');
    mutateSidebar(false);
    renderOrderFormPage();
}

// =============================================================================
// NAVIGATION ACTIONS
// =============================================================================

/**
 * Torna a /orders
 */
export function goBack() {
    console.log('[Actions] Going back to /orders');
    window.location.href = '/orders';
}

/**
 * Logout utente
 * 
 * WORKFLOW:
 * 1. POST /logout
 * 2. Await response
 * 3. Redirect a /
 */
export async function logout() {
    console.log('[Actions] Logout clicked');
    
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        });
        
        if (response.ok) {
            console.log('[Actions] Logout successful, redirecting...');
            window.location.href = '/';
        } else {
            console.error('[Actions] Logout failed');
        }
    } catch (error) {
        console.error('[Actions] Logout error:', error);
    }
}

// =============================================================================
// SCHEDULER ACTIONS (solo CREATE)
// =============================================================================

/**
 * Seleziona giorno nello scheduler.
 * 
 * WORKFLOW:
 * 1. Aggiorna selectedDayId
 * 2. Fetch time slots per nuovo giorno
 * 3. Re-render scheduler + time slots
 * 
 * @param {string} dayId - ID giorno (YYYY-MM-DD)
 */
export async function selectDay(dayId) {
    console.log(`[Actions] Selecting day: ${dayId}`);
    
    if (orderFormState.mode !== 'create') {
        console.warn('[Actions] selectDay called in modify mode, ignoring');
        return;
    }
    
    // Aggiorna state
    mutateSelectedDay(dayId);
    
    // Reset time slot selection (nuovo giorno = nuovi slot)
    mutateSelectedTimeSlot(null);
    
    // Re-render immediato per feedback visivo
    renderOrderFormPage();
    
    // Fetch nuovi time slots
    try {
        const data = await fetchAvailability(dayId);
        
        if (data.timeSlots) {
            mutateAvailability({
                ...orderFormState.availability,
                timeSlots: data.timeSlots,
            });
        }
        
        renderOrderFormPage();
        console.log(`[Actions] Day ${dayId} selected, time slots updated`);
        
    } catch (error) {
        console.error('[Actions] Failed to fetch time slots:', error);
    }
}

// =============================================================================
// TIME SLOT ACTIONS (solo CREATE)
// =============================================================================

/**
 * Seleziona time slot.
 * 
 * @param {number} slotId - ID slot
 */
export function selectTimeSlot(slotId) {
    console.log(`[Actions] Selecting time slot: ${slotId}`);
    
    if (orderFormState.mode !== 'create') {
        console.warn('[Actions] selectTimeSlot called in modify mode, ignoring');
        return;
    }
    
    // Verifica che lo slot sia disponibile
    const slot = orderFormState.availability.timeSlots.find(s => s.id === slotId);
    if (!slot || !slot.available) {
        console.warn('[Actions] Slot not available, ignoring');
        return;
    }
    
    mutateSelectedTimeSlot(slotId);
    renderOrderFormPage();
}

// =============================================================================
// INGREDIENT ACTIONS
// =============================================================================

/**
 * Toggle sezione ingredienti (accordion).
 * 
 * Solo UNA sezione può essere aperta alla volta.
 * 
 * @param {string} sectionId - ID categoria (es. 'bread')
 */
export function toggleSection(sectionId) {
    console.log(`[Actions] Toggling section: ${sectionId}`);
    
    // Se stessa sezione, chiudi. Altrimenti apri nuova.
    const newSectionId = orderFormState.openSectionId === sectionId ? null : sectionId;
    
    mutateOpenSection(newSectionId);
    renderOrderFormPage();
}

/**
 * Seleziona/deseleziona ingrediente.
 * 
 * REGOLE:
 * - Se available === false E non è già selezionato → IGNORA
 * - Se available === false MA è selezionato → permetti deselect (per MODIFY)
 * - Se categoria bread → deseleziona pane precedente
 * 
 * @param {Object} ingredient - { id, name, category, available }
 */
export function selectIngredient(ingredient) {
    console.log(`[Actions] Selecting ingredient:`, ingredient);
    
    // Verifica se è già selezionato
    const isSelected = orderFormState.order.selectedIngredients.some(i => i.id === ingredient.id);
    
    // Se non disponibile E non è già selezionato → IGNORA
    // Se non disponibile MA è selezionato → permetti deselect
    if (!ingredient.available && !isSelected) {
        console.warn('[Actions] Ingredient not available, ignoring');
        return;
    }
    
    toggleIngredient(ingredient);
    renderOrderFormPage();
}

/**
 * Rimuove ingrediente dalla selezione (dal summary).
 * 
 * @param {number} ingredientId - ID ingrediente
 */
export function deselectIngredient(ingredientId) {
    console.log(`[Actions] Deselecting ingredient: ${ingredientId}`);
    
    removeIngredient(ingredientId);
    renderOrderFormPage();
}

// =============================================================================
// SUBMIT ACTIONS
// =============================================================================

/**
 * Submit ordine (create o update in base a mode).
 */
export async function submitOrder() {
    console.log('[Actions] Submitting order...');
    
    // Verifica validità
    if (!isOrderValid()) {
        console.warn('[Actions] Order not valid, cannot submit');
        return;
    }
    
    mutateUI({ isSubmitting: true });
    renderOrderFormPage();
    
    try {
        const ingredientIds = orderFormState.order.selectedIngredients.map(i => i.id);
        
        if (orderFormState.mode === 'create') {
            // CREATE
            await createOrder(
                orderFormState.order.selectedTimeSlotId,
                ingredientIds
            );
        } else {
            // MODIFY
            await updateOrder(
                orderFormState.order.id,
                ingredientIds
            );
        }
        
        console.log('[Actions] Order submitted successfully, redirecting...');
        window.location.href = '/orders';
        
    } catch (error) {
        console.error('[Actions] Submit failed:', error);
        mutateUI({ isSubmitting: false });
        renderOrderFormPage();
        
        // TODO: mostrare errore all'utente
        alert(error.message || 'Errore durante il salvataggio');
    }
}

/**
 * Annulla e torna a /orders.
 */
export function cancel() {
    console.log('[Actions] Cancelling, going back...');
    window.location.href = '/orders';
}

/**
 * Elimina ordine (solo MODIFY).
 */
export async function deleteCurrentOrder() {
    console.log('[Actions] Deleting order...');
    
    if (orderFormState.mode !== 'modify') {
        console.warn('[Actions] deleteCurrentOrder called in create mode, ignoring');
        return;
    }
    
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) {
        return;
    }
    
    mutateUI({ isSubmitting: true });
    renderOrderFormPage();
    
    try {
        await deleteOrder(orderFormState.order.id);
        
        console.log('[Actions] Order deleted successfully, redirecting...');
        window.location.href = '/orders';
        
    } catch (error) {
        console.error('[Actions] Delete failed:', error);
        mutateUI({ isSubmitting: false });
        renderOrderFormPage();
        
        alert(error.message || 'Errore durante l\'eliminazione');
    }
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
    openSidebar,
    closeSidebar,
    goBack,
    logout,
    selectDay,
    selectTimeSlot,
    toggleSection,
    selectIngredient,
    deselectIngredient,
    submitOrder,
    cancel,
    deleteCurrentOrder,
};
