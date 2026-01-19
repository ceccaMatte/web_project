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
 * IDEMPOTENTE: se lo stesso ordine è già selezionato, non fare nulla
 * 
 * @param {number} orderId - ID ordine
 */
export function selectOrder(orderId) {
    // IDEMPOTENZA: se lo stesso ordine è già selezionato, ignora
    if (orderId === workServiceState.selectedOrderId) {
        console.log(`[WorkServiceActions] Order ${orderId} already selected, ignoring`);
        return;
    }
    
    console.log(`[WorkServiceActions] Selecting order: ${orderId}`);
    
    mutateSelectedOrder(orderId);
    
    // Close dropdown when selecting a new order
    workServiceState.isStatusDropdownOpen = false;
    
    // Show mobile recap on mobile devices
    if (window.innerWidth < 1024) {
        showMobileRecap();
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
 * Deseleziona l'ordine corrente
 * Usato per chiudere esplicitamente la recap card
 */
export function deselectOrder() {
    if (workServiceState.selectedOrderId === null) {
        console.log('[WorkServiceActions] No order selected, ignoring deselect');
        return;
    }
    
    console.log('[WorkServiceActions] Deselecting current order');
    mutateSelectedOrder(null);
    hideMobileRecap();
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
    console.log('═══════════════════════════════════════════════════════');
    console.log('[WorkServiceActions] 🚀 changeStatus FUNCTION CALLED!');
    console.log('[WorkServiceActions] 📊 Parameters:', { orderId, newStatus });
    console.log('[WorkServiceActions] 📊 Type check:', { 
        orderIdType: typeof orderId, 
        newStatusType: typeof newStatus 
    });
    console.log(`[WorkServiceActions] Changing order ${orderId} to ${newStatus}`);

    // Trova ordine corrente per rollback
    const order = workServiceState.orders.find(o => o.id === orderId);
    console.log('[WorkServiceActions] 🔍 Order lookup result:', order ? `Found order #${order.daily_number}` : 'NOT FOUND');
    if (!order) {
        console.error('[WorkServiceActions] ❌ Order not found:', orderId);
        console.error('[WorkServiceActions] 📊 Available orders:', workServiceState.orders.map(o => o.id));
        return;
    }

    const previousStatus = order.status;
    console.log('[WorkServiceActions] 📊 Previous status:', previousStatus);
    
    // Se lo stato non cambia, non fare nulla
    if (previousStatus === newStatus) {
        console.log('[WorkServiceActions] ⏭️  Status is the same, skipping');
        workServiceState.isStatusDropdownOpen = false;
        renderRecapCard();
        return;
    }

    // Close dropdown immediately
    console.log('[WorkServiceActions] 🔒 Closing dropdown...');
    workServiceState.isStatusDropdownOpen = false;

    // 1. Optimistic update
    console.log('[WorkServiceActions] 🔄 Step 1: Optimistic update...');
    mutateOrderStatus(orderId, newStatus);
    console.log('[WorkServiceActions] ✅ Optimistic update complete');
    
    // 2. Render immediato (ordine si sposta nella row corretta)
    console.log('[WorkServiceActions] 🖼️  Step 2: Rendering UI...');
    renderOrdersPipeline();
    renderRecapCard();
    console.log('[WorkServiceActions] ✅ UI rendered');

    // 3. API call
    console.log('[WorkServiceActions] 🌐 Step 3: Calling API...');
    console.log('[WorkServiceActions] 🌐 Calling apiChangeOrderStatus:', { orderId, newStatus });
    try {
        const result = await apiChangeOrderStatus(orderId, newStatus);
        console.log('[WorkServiceActions] ✅ API call successful!');
        console.log('[WorkServiceActions] 📊 API response:', result);
        console.log(`[WorkServiceActions] Order ${orderId} status changed successfully to ${newStatus}`);
        console.log('═══════════════════════════════════════════════════════');

    } catch (error) {
        console.error('[WorkServiceActions] ❌ API call FAILED!');
        console.error('[WorkServiceActions] ❌ Error details:', error);
        
        // 4. Rollback
        mutateOrderStatus(orderId, previousStatus);
        renderOrdersPipeline();
        renderRecapCard();

        // Mostra errore all'utente (toast-like, no modal)
        showToast(`Failed to update order: ${error.message}`, 'error');
    }
}

/**
 * Mostra un toast notification (lightweight, no modal)
 */
function showToast(message, type = 'info') {
    // Crea toast element
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-[200] px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all transform translate-y-0 opacity-100 ${
        type === 'error' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-white border border-slate-700'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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

export default { selectDay, selectTimeSlot, selectOrder, deselectOrder, changeStatus, closeRecapModal, logout };
