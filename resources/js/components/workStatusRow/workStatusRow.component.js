/**
 * WORK STATUS ROW COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza una riga della pipeline per uno status specifico
 * - Header con icona, label, contatore
 * - Griglia di order cards
 * 
 * PROPS:
 * - status: 'confirmed' | 'ready' | 'picked_up'
 * - orders: Array<Order>
 * - selectedOrderId: number | null
 * - emptyMessage: string
 * 
 * CALLBACKS:
 * - onSelectOrder: (orderId) => void
 * - onChangeStatus: (orderId, newStatus) => void
 * 
 * UTILIZZO:
 * renderWorkStatusRow(container, { status, orders, selectedOrderId }, callbacks)
 */

import { buildWorkOrderCardHTML } from '../workOrderCard/workOrderCard.component.js';
import { listen } from '../../utils/dom.js';

// Status configuration
const STATUS_CONFIG = {
    confirmed: {
        label: 'Confirmed',
        icon: 'schedule',
        color: 'text-blue-500',
        emptyMessage: 'No confirmed orders',
    },
    ready: {
        label: 'Ready',
        icon: 'check_circle',
        color: 'text-emerald-500',
        emptyMessage: 'No ready orders',
    },
    picked_up: {
        label: 'Picked Up',
        icon: 'verified',
        color: 'text-slate-400',
        emptyMessage: 'No picked up orders',
    },
};

/**
 * Render work status row
 * 
 * @param {HTMLElement} container - Container element [data-status-row="status"]
 * @param {Object} props - Props
 * @param {Object} callbacks - Callbacks
 */
export function renderWorkStatusRow(container, props, callbacks) {
    if (!container) {
        console.warn('[WorkStatusRow] Container is null');
        return;
    }

    const { status, orders, selectedOrderId } = props;
    const { onSelectOrder, onChangeStatus } = callbacks || {};

    const config = STATUS_CONFIG[status];
    if (!config) {
        console.warn(`[WorkStatusRow] Unknown status: ${status}`);
        return;
    }

    const filteredOrders = orders || [];
    const count = filteredOrders.length;

    // Update count in header
    const countEl = container.querySelector(`[data-status-count="${status}"]`);
    if (countEl) {
        countEl.textContent = count.toString();
    }

    // Get orders container
    const ordersContainer = container.querySelector(`[data-status-orders="${status}"]`);
    if (!ordersContainer) {
        console.warn(`[WorkStatusRow] Orders container not found for status: ${status}`);
        return;
    }

    // Empty state
    if (count === 0) {
        ordersContainer.innerHTML = `
            <div class="col-span-full py-8 text-center">
                <span class="material-symbols-outlined text-3xl text-slate-600 mb-2 block">inbox</span>
                <p class="text-slate-500 text-sm">${config.emptyMessage}</p>
            </div>
        `;
        return;
    }

    // Build order cards
    const cardsHTML = filteredOrders
        .map(order => buildWorkOrderCardHTML(order, order.id === selectedOrderId))
        .join('');

    ordersContainer.innerHTML = cardsHTML;

    // Event delegation
    listen(ordersContainer, 'click', (e) => {
        // Handle order selection
        const selectBtn = e.target.closest('[data-action="select-order"]');
        if (selectBtn && onSelectOrder) {
            e.stopPropagation();
            const orderId = parseInt(selectBtn.dataset.orderId, 10);
            onSelectOrder(orderId);
            return;
        }

        // Handle status change
        const changeBtn = e.target.closest('[data-action="change-status"]');
        if (changeBtn && onChangeStatus) {
            e.stopPropagation();
            const orderId = parseInt(changeBtn.dataset.orderId, 10);
            const newStatus = changeBtn.dataset.newStatus;
            onChangeStatus(orderId, newStatus);
            return;
        }
    });

    // Handle keyboard navigation
    listen(ordersContainer, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const card = e.target.closest('[data-action="select-order"]');
            if (card && onSelectOrder) {
                e.preventDefault();
                const orderId = parseInt(card.dataset.orderId, 10);
                onSelectOrder(orderId);
            }
        }
    });

    console.log(`[WorkStatusRow] Rendered ${status} (${count} orders)`);
}

export default { renderWorkStatusRow };
