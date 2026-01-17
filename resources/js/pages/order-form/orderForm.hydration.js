/**
 * ORDER FORM HYDRATION - State Initialization
 * 
 * RESPONSABILITÀ:
 * - Inizializzare state da inline data + API
 * - Flussi separati per CREATE e MODIFY
 * - Gestire loading state
 * 
 * ARCHITETTURA:
 * - Legge inline data dal DOM
 * - Chiama API per dati completi
 * - Popola orderFormState
 * - Trigger render
 */

import { orderFormState, mutateUI, mutateUser, mutateMode, mutateOrder, mutateAvailability, mutateScheduler, mutateSelectedDay } from './orderForm.state.js';
import { fetchCreateData, fetchModifyData, fetchAvailability } from './orderForm.api.js';

/**
 * Hydrate state da inline JSON nel DOM.
 * 
 * Legge #order-form-data e popola state iniziale.
 */
export function hydrateFromInlineData() {
    console.log('[Hydration] Reading inline data...');
    
    const scriptEl = document.getElementById('order-form-data');
    if (!scriptEl) {
        console.error('[Hydration] Inline data script not found');
        return null;
    }
    
    try {
        const data = JSON.parse(scriptEl.textContent);
        console.log('[Hydration] Inline data parsed:', data);
        
        // Mode
        mutateMode(data.mode || 'create');
        
        // User
        if (data.user) {
            mutateUser({
                authenticated: data.user.authenticated || false,
                name: data.user.name || null,
            });
        }
        
        // Order base data
        mutateOrder({
            id: data.orderId || null,
            selectedDay: data.selectedDate || new Date().toISOString().split('T')[0],
        });
        
        // Selected day per scheduler
        if (data.selectedDate) {
            orderFormState.selectedDayId = data.selectedDate;
        }
        
        console.log('[Hydration] Inline data hydrated');
        return data;
        
    } catch (error) {
        console.error('[Hydration] Failed to parse inline data:', error);
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
    console.log(`[Hydration] Hydrating CREATE mode for date: ${date}`);
    
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
        
        mutateUI({ isLoading: false });
        console.log('[Hydration] CREATE mode hydrated successfully');
        
        return data;
        
    } catch (error) {
        console.error('[Hydration] CREATE hydration failed:', error);
        mutateUI({ isLoading: false });
        throw error;
    }
}

/**
 * Hydrate completo per MODIFY mode.
 * 
 * WORKFLOW:
 * 1. Fetch /api/orders/{orderId}/form
 * 2. Popola order.selectedIngredients
 * 3. Popola availability.ingredients
 * 4. Set loading = false
 * 5. Trigger render
 */
export async function hydrateModifyMode(orderId) {
    console.log(`[Hydration] Hydrating MODIFY mode for order: ${orderId}`);
    
    mutateUI({ isLoading: true });
    
    try {
        const data = await fetchModifyData(orderId);
        
        // Order data
        if (data.order) {
            mutateOrder({
                id: data.order.id,
                selectedDay: data.order.date,
                selectedTimeSlotId: null, // In modify non si cambia
                selectedIngredients: data.order.selectedIngredients || [],
            });
        }
        
        // Availability (solo ingredienti in modify)
        if (data.availability) {
            mutateAvailability({
                ingredients: data.availability.ingredients || [],
                timeSlots: [], // In modify non servono
            });
        }
        
        mutateUI({ isLoading: false });
        console.log('[Hydration] MODIFY mode hydrated successfully');
        
        return data;
        
    } catch (error) {
        console.error('[Hydration] MODIFY hydration failed:', error);
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
    console.log('[Hydration] Refreshing availability...');
    
    try {
        const data = await fetchAvailability(date);
        
        // Aggiorna availability
        mutateAvailability({
            ingredients: data.ingredients || orderFormState.availability.ingredients,
            timeSlots: data.timeSlots || orderFormState.availability.timeSlots,
        });
        
        // Rimuovi ingredienti selezionati se non più disponibili
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
            console.log('[Hydration] Removed unavailable ingredients');
            mutateOrder({ selectedIngredients: updatedIngredients });
        }
        
        // Verifica time slot selezionato (solo create)
        if (orderFormState.mode === 'create' && orderFormState.order.selectedTimeSlotId) {
            const slotStillAvailable = (data.timeSlots || []).some(
                slot => slot.id === orderFormState.order.selectedTimeSlotId && slot.available
            );
            
            if (!slotStillAvailable) {
                console.log('[Hydration] Selected time slot no longer available');
                mutateOrder({ selectedTimeSlotId: null });
            }
        }
        
        console.log('[Hydration] Availability refreshed');
        return data;
        
    } catch (error) {
        console.error('[Hydration] Availability refresh failed:', error);
        // Non propagare errore, polling deve continuare
    }
}

export default {
    hydrateFromInlineData,
    hydrateCreateMode,
    hydrateModifyMode,
    refreshAvailability,
};
