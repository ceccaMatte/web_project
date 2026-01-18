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
    setUserInteracting,
    resetUserInteractionAfterDelay,
} from './adminWorkService.state.js';
import { changeOrderStatus as apiChangeOrderStatus } from './adminWorkService.api.js';
import { refreshWorkServiceState } from './adminWorkService.hydration.js';
import { renderWorkServicePage, renderOrdersPipeline, renderRecapCard, toggleRecapModal, renderTimeSlotSelector } from './adminWorkService.render.js';

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

    // Reset user interaction flag quando si cambia giorno
    setUserInteracting(false);
    
    // Reset user interaction flag quando si cambia giorno
    setUserInteracting(false);
    
    mutateSelectedDay(dayId);
    
    // Refresh data for new day
    await refreshWorkServiceState(dayId);
}

/**
 * Seleziona un time slot (IDEMPOTENTE)
 * 
 * @param {number|'all'} slotId - ID time slot o 'all'
 */
export function selectTimeSlot(slotId) {
    const actionStartTime = performance.now();
    console.log(`[WorkServiceActions] ⚡ START selectTimeSlot(${slotId}) at ${actionStartTime}ms`);
    console.log(`[WorkServiceActions] 📊 Current state:`, {
        currentSelectedSlot: workServiceState.selectedTimeSlotId,
        isUserInteracting: workServiceState.isUserInteracting,
        ordersCount: workServiceState.orders?.length || 0,
        timeSlotsCount: workServiceState.timeSlots?.length || 0
    });

    // IDEMPOTENZA: Non fare nulla se lo slot è già selezionato
    const mutateStartTime = performance.now();
    const wasChanged = mutateSelectedTimeSlot(slotId);
    const mutateEndTime = performance.now();
    console.log(`[WorkServiceActions] 🔄 State mutation took ${(mutateEndTime - mutateStartTime).toFixed(2)}ms`);
    
    if (!wasChanged) {
        const totalTime = performance.now() - actionStartTime;
        console.log(`[WorkServiceActions] ⏭️  SKIP: Time slot ${slotId} already selected, completed in ${totalTime.toFixed(2)}ms`);
        return;
    }

    console.log(`[WorkServiceActions] 🚫 Setting user interaction flag to block polling...`);
    // Marca che l'utente sta interagendo (blocca polling interferenza)
    setUserInteracting(true);
    resetUserInteractionAfterDelay(3000);

    // Render solo i componenti interessati
    const renderStartTime = performance.now();
    console.log(`[WorkServiceActions] 🖼️  Starting selective renders...`);
    
    renderTimeSlotSelector();
    const selectorRenderTime = performance.now();
    console.log(`[WorkServiceActions] ✅ TimeSlotSelector rendered in ${(selectorRenderTime - renderStartTime).toFixed(2)}ms`);
    
    renderOrdersPipeline();
    const pipelineRenderTime = performance.now();
    console.log(`[WorkServiceActions] ✅ OrdersPipeline rendered in ${(pipelineRenderTime - selectorRenderTime).toFixed(2)}ms`);
    
    const totalTime = performance.now() - actionStartTime;
    console.log(`[WorkServiceActions] ✅ COMPLETE selectTimeSlot(${slotId}) in ${totalTime.toFixed(2)}ms`, {
        mutationTime: (mutateEndTime - mutateStartTime).toFixed(2) + 'ms',
        selectorRenderTime: (selectorRenderTime - renderStartTime).toFixed(2) + 'ms',
        pipelineRenderTime: (pipelineRenderTime - selectorRenderTime).toFixed(2) + 'ms',
        totalRenderTime: (pipelineRenderTime - renderStartTime).toFixed(2) + 'ms',
        totalActionTime: totalTime.toFixed(2) + 'ms'
    });
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
        hideMobileRecap();
    } else {
        mutateSelectedOrder(orderId);
        
        // Show mobile recap on mobile devices
        if (window.innerWidth < 1024) {
            showMobileRecap();
        }
    }

    renderOrdersPipeline();
    renderRecapCard();
}

/**
 * Mostra mobile recap (bottom sheet)
 */
function showMobileRecap() {
    const mobileRecap = document.querySelector('[data-recap-mobile]');
    if (mobileRecap) {
        mobileRecap.classList.remove('translate-y-full');
        mobileRecap.classList.add('translate-y-0');
    }
}

/**
 * Nasconde mobile recap
 */
function hideMobileRecap() {
    const mobileRecap = document.querySelector('[data-recap-mobile]');
    if (mobileRecap) {
        mobileRecap.classList.remove('translate-y-0');
        mobileRecap.classList.add('translate-y-full');
    }
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
