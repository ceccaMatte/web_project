// Actions for admin work service page

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
    if (dayId === workServiceState.selectedDayId) return;

    // Evita interferenze polling quando si cambia giorno
    setUserInteracting(false);
    mutateSelectedDay(dayId);
    await refreshWorkServiceState(dayId);
}

/**
 * Seleziona un time slot (IDEMPOTENTE)
 * 
 * @param {number|'all'} slotId - ID time slot o 'all'
 */
export function selectTimeSlot(slotId) {
    const wasChanged = mutateSelectedTimeSlot(slotId);
    if (!wasChanged) return;

    // Blocca polling per breve interazione utente
    setUserInteracting(true);
    resetUserInteractionAfterDelay(3000);

    renderTimeSlotSelector();
    renderOrdersPipeline();
}

/**
 * Seleziona un ordine per visualizzazione recap
 * IDEMPOTENTE: se lo stesso ordine è già selezionato, non fare nulla
 * 
 * @param {number} orderId - ID ordine
 */
export function selectOrder(orderId) {
    if (orderId === workServiceState.selectedOrderId) return;

    mutateSelectedOrder(orderId);
    workServiceState.isStatusDropdownOpen = false;
    if (window.innerWidth < 1024) showMobileRecap();
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
    if (workServiceState.selectedOrderId === null) return;
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
    const order = workServiceState.orders.find(o => o.id === orderId);
    if (!order) {
        console.error('Order not found:', orderId);
        return;
    }

    const previousStatus = order.status;
    if (previousStatus === newStatus) {
        workServiceState.isStatusDropdownOpen = false;
        renderRecapCard();
        return;
    }

    workServiceState.isStatusDropdownOpen = false;
    // Optimistic update
    mutateOrderStatus(orderId, newStatus);
    renderOrdersPipeline();
    renderRecapCard();

    try {
        await apiChangeOrderStatus(orderId, newStatus);
    } catch (error) {
        console.error('Failed to change order status:', error);
        mutateOrderStatus(orderId, previousStatus);
        renderOrdersPipeline();
        renderRecapCard();
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
    mutateSelectedOrder(null);
    toggleRecapModal(false);
    renderOrdersPipeline();
    renderRecapCard();
}

/**
 * Logout action
 */
export function logout() {
    const form = document.querySelector('form[action*="logout"]');
    if (form) return form.submit();
    window.location.href = '/logout';
}

export default { selectDay, selectTimeSlot, selectOrder, deselectOrder, changeStatus, closeRecapModal, logout };
