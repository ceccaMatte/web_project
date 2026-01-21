// State hydration utilities for order form

import { 
    orderFormState, 
    mutateUI, 
    mutateUser, 
    mutateMode, 
    mutateOrder, 
    mutateAvailability, 
    mutateScheduler, 
    mutateSelectedDay,
    resetAndApplySelection,
    deriveSelectedIds,
} from './orderForm.state.js';
import { fetchCreateData, fetchModifyData, fetchAvailability } from './orderForm.api.js';

/**
 * Hydrate state da inline JSON nel DOM.
 * 
 * Legge #order-form-data e popola state iniziale.
 */
export function hydrateFromInlineData() {
    
    const scriptEl = document.getElementById('order-form-data');
    if (!scriptEl) {
        console.error('Inline data script not found');
        return null;
    }
    
    try {
        const data = JSON.parse(scriptEl.textContent);
        // Mode
        mutateMode(data.mode || 'create');
        
        // User
        if (data.user) {
            mutateUser({
                authenticated: data.user.authenticated || false,
                name: data.user.name || null,
            });
        }
        
        // Order base data (senza ingredienti - quelli vengono dopo)
        mutateOrder({
            id: data.orderId || null,
            selectedDay: data.selectedDate || new Date().toISOString().split('T')[0],
            selectedTimeSlotId: null,
            selectedIngredients: [], // Reset - verranno applicati atomicamente dopo
        });
        
        // Use atomic reset/apply for initial selection
        if (data.reorderIngredients && data.reorderIngredients.length > 0) {
            resetAndApplySelection(data.reorderIngredients);
        }
        
        // Selected day per scheduler
        if (data.selectedDate) {
            orderFormState.selectedDayId = data.selectedDate;
        }
        
        return data;
        
    } catch (error) {
        console.error('Failed to parse inline data:', error);
        return null;
    }
}

/**
 * Hydrate completo per CREATE mode.
 * 
 * WORKFLOW:
 * 1. Fetch /api/orders/form/create?date=YYYY-MM-DD
 * 2. Popola availability (ingredients + timeSlots)
 * 3. Popola scheduler data
 * 4. Set loading = false
 * 5. Trigger render
 */
export async function hydrateCreateMode(date) {
    mutateUI({ isLoading: true });
    
    try {
        const data = await fetchCreateData(date);
        
        // Availability
        if (data.availability) {
            mutateAvailability({
                ingredients: data.availability.ingredients || [],
                timeSlots: data.availability.timeSlots || [],
            });
        }
        
        // Scheduler (usa stessa struttura di Home)
        // Il backend dovrebbe restituire scheduler data
        // Per ora costruiamo weekDays basic se non presente
        if (data.scheduler) {
            mutateScheduler({
                monthLabel: data.scheduler.monthLabel,
                weekDays: data.scheduler.weekDays,
                selectedDayId: data.scheduler.selectedDayId,
            });
        }
        
        return data;
        
    } catch (error) {
        console.error('CREATE hydration failed:', error);
        mutateUI({ isLoading: false });
        throw error;
    }
}

/**
 * Hydrate completo per MODIFY mode.
 * 
 * WORKFLOW:
 * 1. Fetch /api/orders/{orderId}/form
 * 2. Aggiorna availability PRIMA della selezione
 * 3. Usa resetAndApplySelection (STESSO di REORDER) per SSOT
 * 4. Set loading = false
 * 5. Trigger render
 * 
 * SSOT CRITICO:
 * - NON fare merge con stato precedente
 * - Usa resetAndApplySelection per reset atomico
 */
export async function hydrateModifyMode(orderId) {
    mutateUI({ isLoading: true });
    
    try {
        const data = await fetchModifyData(orderId);
        
        // 1. Availability PRIMA (così i dropdown hanno i dati)
        if (data.availability) {
            mutateAvailability({
                ingredients: data.availability.ingredients || [],
                timeSlots: [], // In modify non servono
            });
        }
        
        // 2. Order metadata (senza ingredienti - quelli vengono dopo)
        if (data.order) {
            mutateOrder({
                id: data.order.id,
                selectedDay: data.order.date,
                selectedTimeSlotId: null, // In modify non si cambia
                // NON settare selectedIngredients qui - usa resetAndApplySelection
            });
            
            // Apply selection atomically (SSOT)
            resetAndApplySelection(data.order.selectedIngredients || []);
        }
        
        // 4. Debug: verifica coerenza
        const summaryCount = orderFormState.order.selectedIngredients.length;
        const selectedIds = deriveSelectedIds();
        mutateUI({ isLoading: false });
        
        return data;
        
    } catch (error) {
        console.error('MODIFY hydration failed:', error);
        mutateUI({ isLoading: false });
        throw error;
    }
}

/**
 * Refresh availability (per polling).
 * 
 * NON resetta lo state, aggiorna solo availability.
 * Rimuove ingredienti selezionati se non più disponibili.
 * 
 * @param {string|null} date - Data per time slots (solo create)
 */
export async function refreshAvailability(date = null) {
    try {
        const data = await fetchAvailability(date);
        
        // Aggiorna availability
        mutateAvailability({
            ingredients: data.ingredients || orderFormState.availability.ingredients,
            timeSlots: data.timeSlots || orderFormState.availability.timeSlots,
        });
        
        // In MODIFY: preserva ingredienti selezionati anche se non disponibili
        // In CREATE: rimuovi ingredienti selezionati se non più disponibili
        if (orderFormState.mode === 'create') {
            const availableIds = new Set();
            (data.ingredients || []).forEach(cat => {
                cat.items.forEach(item => {
                    if (item.available) {
                        availableIds.add(item.id);
                    }
                });
            });
            
            const updatedIngredients = orderFormState.order.selectedIngredients.filter(
                ing => availableIds.has(ing.id)
            );
            
            if (updatedIngredients.length !== orderFormState.order.selectedIngredients.length) {
                mutateOrder({ selectedIngredients: updatedIngredients });
            }
        }
        // In MODIFY mode non rimuovere MAI ingredienti selezionati
        
        // Verifica time slot selezionato (solo create)
        if (orderFormState.mode === 'create' && orderFormState.order.selectedTimeSlotId) {
            const slotStillAvailable = (data.timeSlots || []).some(
                slot => slot.id === orderFormState.order.selectedTimeSlotId && slot.available
            );
            
            if (!slotStillAvailable) {
                mutateOrder({ selectedTimeSlotId: null });
            }
        }
        return data;
        
    } catch (error) {
        console.error('Availability refresh failed:', error);
        // Do not propagate; polling should continue
    }
}

export default {
    hydrateFromInlineData,
    hydrateCreateMode,
    hydrateModifyMode,
    refreshAvailability,
};
