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
import { renderWorkOrderCard } from '../workOrderCard/workOrderCard.component.js';
import { ORDER_STATUS_CONFIG, getStatusMeta } from '../../config/orderStatus.config.js';

// Registry per tracciare i listener già registrati
// Previene registrazione multipla di listener sullo stesso container
const listenerRegistry = new WeakMap();

// Status row configuration (empty messages)
const STATUS_ROW_CONFIG = {
    confirmed: {
        emptyMessage: 'No confirmed orders',
    },
    ready: {
        emptyMessage: 'No ready orders',
    },
    picked_up: {
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

    const statusMeta = getStatusMeta(status);
    const rowConfig = STATUS_ROW_CONFIG[status];
    if (!rowConfig) {
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
            <div class="flex py-2 gap-x-2 text-center">
                <span class="material-symbols-outlined text-3xl text-slate-600 mb-2 block">inbox</span>
                <p class="text-slate-500 text-sm">${rowConfig.emptyMessage}</p>
            </div>
        `;
        return;
    }

    // Build order cards
    const cardsHTML = filteredOrders
        .map(order => buildWorkOrderCardHTML(order, order.id === selectedOrderId))
        .join('');

    ordersContainer.innerHTML = cardsHTML;

    // SINGLETON LISTENER PATTERN:
    // Registra listener SOLO se non già registrato per questo container
    // Salva i callbacks nel registry così possono essere aggiornati senza riregistrare
    if (!listenerRegistry.has(ordersContainer)) {
        // Prima registrazione: crea entry nel registry e registra listeners
        listenerRegistry.set(ordersContainer, { onSelectOrder, onChangeStatus });
        
        // Click handler delegato - legge callbacks dal registry
        ordersContainer.addEventListener('click', (e) => {
            const callbacks = listenerRegistry.get(ordersContainer);
            if (!callbacks) return;
            
            const selectBtn = e.target.closest('[data-action="select-order"]');
            if (selectBtn && callbacks.onSelectOrder) {
                e.stopPropagation();
                e.preventDefault();
                const orderId = parseInt(selectBtn.dataset.orderId, 10);
                callbacks.onSelectOrder(orderId);
                return;
            }

            const changeBtn = e.target.closest('[data-action="change-status"]');
            if (changeBtn && callbacks.onChangeStatus) {
                e.stopPropagation();
                e.preventDefault();
                const orderId = parseInt(changeBtn.dataset.orderId, 10);
                const newStatus = changeBtn.dataset.newStatus;
                callbacks.onChangeStatus(orderId, newStatus);
                return;
            }
        });

        // Keyboard handler delegato
        ordersContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const callbacks = listenerRegistry.get(ordersContainer);
                if (!callbacks) return;
                
                const card = e.target.closest('[data-action="select-order"]');
                if (card && callbacks.onSelectOrder) {
                    e.preventDefault();
                    const orderId = parseInt(card.dataset.orderId, 10);
                    callbacks.onSelectOrder(orderId);
                }
            }
        });
    } else {
        // Listener già registrato: aggiorna solo i callbacks nel registry
        listenerRegistry.set(ordersContainer, { onSelectOrder, onChangeStatus });
    }

    console.log(`[WorkStatusRow] Rendered ${status} (${count} orders)`);
}

export default { renderWorkStatusRow };
