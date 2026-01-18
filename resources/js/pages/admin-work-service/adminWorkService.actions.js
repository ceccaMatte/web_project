/**
 * ADMIN WORK SERVICE ACTIONS
 * 
 * RESPONSABILITÀ:
 * - Gestisce azioni utente
 * - Muta state
 * - Trigger render
 * - Comunicazione API per side effects
 */

import { 
    workServiceState,
    mutateSelectedDay,
    mutateSelectedTimeSlot,
    mutateSelectedOrder,
    mutateOrderStatus,
} from './adminWorkService.state.js';
import { changeOrderStatus as apiChangeOrderStatus } from './adminWorkService.api.js';
import { refreshWorkServiceState } from './adminWorkService.hydration.js';
import { renderWorkServicePage, renderOrdersPipeline, renderRecapCard, toggleRecapModal } from './adminWorkService.render.js';

/**
 * Seleziona un giorno diverso nello scheduler
 * 
 * @param {string} dayId - ID giorno (YYYY-MM-DD)
 */
export async function selectDay(dayId) {
    console.log(`[WorkServiceActions] Selecting day: ${dayId}`);

    if (dayId === workServiceState.selectedDayId) {
        console.log('[WorkServiceActions] Same day selected, ignoring');
        return;
    }

    mutateSelectedDay(dayId);
    
    // Refresh data for new day
    await refreshWorkServiceState(dayId);
}

/**
 * Seleziona un time slot
 * 
 * @param {number|'all'} slotId - ID time slot o 'all'
 */
export function selectTimeSlot(slotId) {
    console.log(`[WorkServiceActions] Selecting time slot: ${slotId}`);

    mutateSelectedTimeSlot(slotId);
    renderTimeSlotSelector();
    renderOrdersPipeline();
}

/**
 * Seleziona un ordine per visualizzazione recap
 * 
 * @param {number} orderId - ID ordine
 */
export function selectOrder(orderId) {
    console.log(`[WorkServiceActions] Selecting order: ${orderId}`);

    // Toggle selection if clicking same order
    if (orderId === workServiceState.selectedOrderId) {
        mutateSelectedOrder(null);
        toggleRecapModal(false);
    } else {
        mutateSelectedOrder(orderId);
        
        // Show modal on mobile
        if (window.innerWidth < 1024) {
            toggleRecapModal(true);
        }
    }

    renderOrdersPipeline();
    renderRecapCard();
}

/**
 * Cambia stato di un ordine
 * 
 * WORKFLOW:
 * 1. Optimistic update locale
 * 2. Render immediato
 * 3. API call
 * 4. Se fallisce, rollback
 * 
 * @param {number} orderId - ID ordine
 * @param {string} newStatus - Nuovo stato
 */
export async function changeStatus(orderId, newStatus) {
    console.log(`[WorkServiceActions] Changing order ${orderId} to ${newStatus}`);

    // Trova ordine corrente per rollback
    const order = workServiceState.orders.find(o => o.id === orderId);
    if (!order) {
        console.error('[WorkServiceActions] Order not found:', orderId);
        return;
    }

    const previousStatus = order.status;

    // 1. Optimistic update
    mutateOrderStatus(orderId, newStatus);
    
    // 2. Render immediato
    renderOrdersPipeline();
    renderRecapCard();

    // 3. API call
    try {
        await apiChangeOrderStatus(orderId, newStatus);
        console.log(`[WorkServiceActions] Order ${orderId} status changed successfully`);
        
        // Se l'ordine era selezionato e ora è picked_up, deseleziona
        if (workServiceState.selectedOrderId === orderId && newStatus === 'picked_up') {
            // Opzionale: deseleziona dopo picked_up
            // mutateSelectedOrder(null);
            // toggleRecapModal(false);
        }

    } catch (error) {
        console.error('[WorkServiceActions] Failed to change status:', error);
        
        // 4. Rollback
        mutateOrderStatus(orderId, previousStatus);
        renderOrdersPipeline();
        renderRecapCard();

        // Mostra errore all'utente
        alert(`Failed to update order status: ${error.message}`);
    }
}

/**
 * Chiude la recap modal (mobile)
 */
export function closeRecapModal() {
    console.log('[WorkServiceActions] Closing recap modal');
    mutateSelectedOrder(null);
    toggleRecapModal(false);
    renderOrdersPipeline();
    renderRecapCard();
}

/**
 * Logout action
 */
export function logout() {
    console.log('[WorkServiceActions] Logging out...');
    
    const form = document.querySelector('form[action*="logout"]');
    if (form) {
        form.submit();
    } else {
        window.location.href = '/logout';
    }
}

export default { selectDay, selectTimeSlot, selectOrder, changeStatus, closeRecapModal, logout };
