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

    const { selectDay } = getCallbacks();

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

    const { selectTimeSlot } = getCallbacks();

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
    const { selectOrder, changeStatus } = getCallbacks();

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
 * Render recap card (desktop + mobile modal)
 */
export function renderRecapCard() {
    const selectedOrder = getSelectedOrder();
    const { changeStatus } = getCallbacks();

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
 * Lazy-loaded callbacks to avoid circular imports
 */
let _callbacks = null;

function getCallbacks() {
    if (!_callbacks) {
        // Import actions module lazily
        import('./adminWorkService.actions.js').then(module => {
            _callbacks = {
                selectDay: module.selectDay,
                selectTimeSlot: module.selectTimeSlot,
                selectOrder: module.selectOrder,
                changeStatus: module.changeStatus,
            };
        });

        // Return placeholder callbacks for first render
        return {
            selectDay: () => {},
            selectTimeSlot: () => {},
            selectOrder: () => {},
            changeStatus: () => {},
        };
    }

    return _callbacks;
}

// Initialize callbacks immediately
import('./adminWorkService.actions.js').then(module => {
    _callbacks = {
        selectDay: module.selectDay,
        selectTimeSlot: module.selectTimeSlot,
        selectOrder: module.selectOrder,
        changeStatus: module.changeStatus,
    };
});

export default { renderWorkServicePage, renderCurrentTime };
