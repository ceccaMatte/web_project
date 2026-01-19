/**
 * ADMIN WORK SERVICE RENDER
 * 
 * RESPONSABILITÀ:
 * - Orchestrazione render componenti
 * - Trasforma state in props per componenti
 * - Chiama componenti con props + callbacks
 */

import { workServiceState, getOrdersByStatus, getSelectedOrder } from './adminWorkService.state.js';
import { workServiceView } from './adminWorkService.view.js';
import { renderWeekScheduler } from '../../components/weekScheduler/weekScheduler.component.js';
import { renderWorkTimeSlotSelector } from '../../components/workTimeSlotSelector/workTimeSlotSelector.component.js';
import { renderWorkStatusRow } from '../../components/workStatusRow/workStatusRow.component.js';
import { renderWorkOrderRecapCard, buildWorkOrderRecapCardHTML } from '../../components/workOrderRecapCard/workOrderRecapCard.component.js';
import { listen } from '../../utils/dom.js';

/**
 * Flag to avoid adding multiple listeners to mobile recap
 */
let mobileRecapListenerAdded = false;

/**
 * Render completo della pagina
 * 
 * Chiamato dopo ogni mutation dello state.
 */
export function renderWorkServicePage() {
    console.log('[WorkServiceRender] Rendering page...');

    renderCurrentTime();
    renderScheduler();
    renderTimeSlotSelector();
    renderOrdersPipeline();
    renderRecapCard();

    console.log('[WorkServiceRender] Page rendered');
}

/**
 * Render current time display
 */
export function renderCurrentTime() {
    const el = workServiceView.currentTimeEl;
    if (!el) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `${hours}:${minutes}`;
}

/**
 * Render scheduler settimanale
 */
export function renderScheduler() {
    const container = workServiceView.schedulerSection;
    if (!container) return;

    const callbacks = getCallbacks();
    const selectDay = callbacks?.selectDay || (() => console.warn('[Render] selectDay callback not ready'));

    renderWeekScheduler(container, {
        monthLabel: workServiceState.monthLabel,
        weekDays: workServiceState.weekDays,
    }, {
        onDaySelected: selectDay,
    });
}

/**
 * Render time slot selector
 */
export function renderTimeSlotSelector() {
    const container = workServiceView.timeSlotsSection;
    if (!container) return;

    const callbacks = getCallbacks();
    const selectTimeSlot = callbacks?.selectTimeSlot || (() => console.warn('[Render] selectTimeSlot callback not ready'));

    // Preserve scroll position by finding the topmost visible slot
    const scrollContainer = container.querySelector('.flex.overflow-x-auto');
    let topVisibleSlotId = null;
    if (scrollContainer) {
        const slotElements = scrollContainer.querySelectorAll('[data-slot-id]');
        let minDistance = Infinity;
        for (const el of slotElements) {
            const distance = Math.abs(el.offsetLeft - scrollContainer.scrollLeft);
            if (distance < minDistance) {
                minDistance = distance;
                topVisibleSlotId = el.dataset.slotId;
            }
        }
    }

    renderWorkTimeSlotSelector(container, {
        timeSlots: workServiceState.timeSlots,
        selectedSlotId: workServiceState.selectedTimeSlotId,
    }, {
        onSlotSelect: selectTimeSlot,
    });

    // Restore scroll position to the previously visible slot
    if (topVisibleSlotId) {
        const newScrollContainer = container.querySelector('.flex.overflow-x-auto');
        if (newScrollContainer) {
            const targetEl = newScrollContainer.querySelector(`[data-slot-id="${topVisibleSlotId}"]`);
            if (targetEl) {
                targetEl.scrollIntoView({ block: 'nearest', inline: 'start' });
            }
        }
    }
}

/**
 * Render orders pipeline (3 status rows)
 */
export function renderOrdersPipeline() {
    const { confirmed, ready, picked_up } = getOrdersByStatus();
    const callbacks = getCallbacks();
    
    // Fallback if callbacks not loaded yet
    const selectOrder = callbacks?.selectOrder || (() => console.warn('[Render] selectOrder callback not ready'));
    const changeStatus = callbacks?.changeStatus || (() => console.warn('[Render] changeStatus callback not ready'));

    // Render each status row
    renderWorkStatusRow(workServiceView.confirmedRow, {
        status: 'confirmed',
        orders: confirmed,
        selectedOrderId: workServiceState.selectedOrderId,
    }, {
        onSelectOrder: selectOrder,
        onChangeStatus: changeStatus,
    });

    renderWorkStatusRow(workServiceView.readyRow, {
        status: 'ready',
        orders: ready,
        selectedOrderId: workServiceState.selectedOrderId,
    }, {
        onSelectOrder: selectOrder,
        onChangeStatus: changeStatus,
    });

    renderWorkStatusRow(workServiceView.pickedUpRow, {
        status: 'picked_up',
        orders: picked_up,
        selectedOrderId: workServiceState.selectedOrderId,
    }, {
        onSelectOrder: selectOrder,
        onChangeStatus: changeStatus,
    });
}

/**
 * Render recap card (desktop + mobile modal + mobile sticky)
 */
export function renderRecapCard() {
    const selectedOrder = getSelectedOrder();
    const callbacks = getCallbacks();
    
    console.log('[WorkServiceRender] 🔍 renderRecapCard called');
    console.log('[WorkServiceRender] 📊 callbacks object:', callbacks);
    console.log('[WorkServiceRender] 📊 callbacks.changeStatus exists?', !!callbacks?.changeStatus);
    console.log('[WorkServiceRender] 📊 callbacks.changeStatus type:', typeof callbacks?.changeStatus);
    
    // Fallback if callbacks not loaded yet
    const changeStatus = callbacks?.changeStatus || (() => console.warn('[Render] changeStatus callback not ready'));
    
    console.log('[WorkServiceRender] 📊 Final changeStatus function type:', typeof changeStatus);

    // Desktop sidebar recap
    renderWorkOrderRecapCard(workServiceView.recapCard, selectedOrder, {
        onChangeStatus: changeStatus,
    });

    // Mobile modal content
    const modalContent = workServiceView.recapModalContent;
    if (modalContent) {
        modalContent.innerHTML = buildWorkOrderRecapCardHTML(selectedOrder);
        
        // Add event listener for action button in modal
        const actionBtn = modalContent.querySelector('[data-action="change-status"]');
        if (actionBtn && changeStatus) {
            actionBtn.addEventListener('click', () => {
                const orderId = parseInt(actionBtn.dataset.orderId, 10);
                const newStatus = actionBtn.dataset.newStatus;
                changeStatus(orderId, newStatus);
            });
        }
    }

    // Mobile sticky recap
    const mobileRecap = document.querySelector('[data-recap-mobile]');
    if (mobileRecap) {
        const isExpanded = workServiceState.mobileRecapExpanded;
        
        // Always position at bottom (visible)
        mobileRecap.style.transform = 'translateY(0)';
        
        const contentDiv = mobileRecap.querySelector('[data-recap-mobile-content]');
        
        if (selectedOrder) {
            // Hide empty state
            const emptyEl = mobileRecap.querySelector('[data-recap-empty]');
            if (emptyEl) emptyEl.classList.add('hidden');
            
            // Show and populate content
            const contentEl = mobileRecap.querySelector('[data-recap-content]');
            if (contentEl) {
                contentEl.innerHTML = buildWorkOrderRecapCardHTML(selectedOrder, isExpanded);
                contentEl.classList.remove('hidden');
                
                // Apply expansion state to content visibility
                if (isExpanded) {
                    contentDiv.style.maxHeight = '60vh';
                    contentDiv.style.overflow = 'auto';
                } else {
                    contentDiv.style.maxHeight = 'auto';
                    contentDiv.style.overflow = 'visible';
                }
            }
        } else {
            // Show empty state
            const emptyEl = mobileRecap.querySelector('[data-recap-empty]');
            if (emptyEl) emptyEl.classList.remove('hidden');
            
            // Hide content
            const contentEl = mobileRecap.querySelector('[data-recap-content]');
            if (contentEl) contentEl.classList.add('hidden');
            
            // Reset expanded state
            workServiceState.mobileRecapExpanded = false;
            
            contentDiv.style.maxHeight = 'auto';
            contentDiv.style.overflow = 'visible';
        }
        
        // Add listener once for toggle-recap-expansion button (inside content)
        if (!mobileRecapListenerAdded) {
            listen(mobileRecap, 'click', (e) => {
                if (e.target.closest('[data-action="toggle-recap-expansion"]')) {
                    workServiceState.mobileRecapExpanded = !workServiceState.mobileRecapExpanded;
                    renderRecapCard();
                    console.log(`[MobileRecap] Toggled to: ${workServiceState.mobileRecapExpanded ? 'expanded' : 'collapsed'}`);
                }
            });
            mobileRecapListenerAdded = true;
        }
    }
}

/**
 * Mostra/nasconde mobile recap modal
 */
export function toggleRecapModal(show) {
    const modal = workServiceView.recapModal;
    if (!modal) return;

    if (show) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// ============================================================================
// CALLBACKS FACTORY
// ============================================================================

/**
 * Cached callbacks - loaded once
 */
let _callbacks = null;
let _callbacksPromise = null;

/**
 * Get callbacks synchronously (after initialization)
 * Returns null if not yet loaded
 */
function getCallbacks() {
    return _callbacks;
}

/**
 * Ensure callbacks are loaded - call this before using getCallbacks()
 */
async function ensureCallbacksLoaded() {
    if (_callbacks) return _callbacks;
    
    if (!_callbacksPromise) {
        _callbacksPromise = import('./adminWorkService.actions.js').then(module => {
            _callbacks = {
                selectDay: module.selectDay,
                selectTimeSlot: module.selectTimeSlot,
                selectOrder: module.selectOrder,
                changeStatus: module.changeStatus,
            };
            console.log('[WorkServiceRender] Callbacks loaded successfully');
            return _callbacks;
        });
    }
    
    return _callbacksPromise;
}

// Initialize callbacks immediately on module load
ensureCallbacksLoaded();

export default { renderWorkServicePage, renderCurrentTime };
