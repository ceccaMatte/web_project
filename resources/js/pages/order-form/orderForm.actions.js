// Action handlers for order form

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
    mutateSidebar(true);
    renderOrderFormPage();
}

/**
 * Chiudi sidebar
 */
export function closeSidebar() {
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
            window.location.href = '/';
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
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
    
    if (orderFormState.mode !== 'create') {
        console.warn('selectDay called in modify mode, ignoring');
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
        
    } catch (error) {
        console.error('Failed to fetch time slots:', error);
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
    
    if (orderFormState.mode !== 'create') {
        console.warn('selectTimeSlot called in modify mode, ignoring');
        return;
    }
    
    // Verifica che lo slot sia disponibile
    const slot = orderFormState.availability.timeSlots.find(s => s.id === slotId);
    if (!slot || !slot.available) {
        console.warn('Slot not available, ignoring');
        return;
    }
    
    mutateSelectedTimeSlot(slotId);
    renderOrderFormPage();
}

// =============================================================================
// INGREDIENT ACTIONS
// =============================================================================

// Only one section open at a time
export function toggleSection(sectionId) {
    const newSectionId = orderFormState.openSectionId === sectionId ? null : sectionId;
    mutateOpenSection(newSectionId);
    renderOrderFormPage();
}

// Handles ingredient selection rules (availability, bread uniqueness)
export function selectIngredient(ingredient) {
    const isSelected = orderFormState.order.selectedIngredients.some(i => i.id === ingredient.id);
    if (!ingredient.available && !isSelected) {
        console.warn('Ingredient not available, ignoring');
        return;
    }
    toggleIngredient(ingredient);
    renderOrderFormPage();
}

export function deselectIngredient(ingredientId) {
    try {
        removeIngredient(ingredientId);
        renderOrderFormPage();
    } catch (err) {
        console.error('Error during deselectIngredient:', err);
    }
}

// =============================================================================
// SUBMIT ACTIONS
// =============================================================================

/**
 * Submit ordine (create o update in base a mode).
 */
export async function submitOrder() {
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
        
        window.location.href = '/orders';
        
    } catch (error) {
        console.error('Submit failed:', error);
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
    window.location.href = '/orders';
}

/**
 * Elimina ordine (solo MODIFY).
 */
export async function deleteCurrentOrder() {
    
    if (orderFormState.mode !== 'modify') {
        console.warn('deleteCurrentOrder called in create mode, ignoring');
        return;
    }
    
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) {
        return;
    }
    
    mutateUI({ isSubmitting: true });
    renderOrderFormPage();
    
    try {
        await deleteOrder(orderFormState.order.id);
        
        
        window.location.href = '/orders';
        
    } catch (error) {
        console.error('Delete failed:', error);
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
