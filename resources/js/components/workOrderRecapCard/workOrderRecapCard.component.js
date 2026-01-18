/**
 * WORK ORDER RECAP CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza dettagli completi di un ordine selezionato
 * - Mostra: numero, status, utente, time slot, ingredienti per categoria
 * - Azioni: avanza stato, chiudi
 * - Usato sia in sidebar desktop che in modal mobile
 * 
 * PROPS:
 * - order: { id, daily_number, status, time_slot, user, ingredients, created_at }
 * 
 * CALLBACKS:
 * - onClose: () => void
 * - onChangeStatus: (orderId, newStatus) => void
 * 
 * UTILIZZO:
 * buildWorkOrderRecapCardHTML(order)
 */

import { buildOrderIngredientsSectionHTML } from '../orderIngredientsSection/orderIngredientsSection.component.js';

// Status configuration
const STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        nextStatus: 'confirmed',
        actionLabel: 'Confirm',
    },
    confirmed: {
        label: 'Confirmed',
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        nextStatus: 'ready',
        actionLabel: 'Mark Ready',
    },
    ready: {
        label: 'Ready',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        nextStatus: 'picked_up',
        actionLabel: 'Mark Picked Up',
    },
    picked_up: {
        label: 'Picked Up',
        color: 'text-slate-400',
        bg: 'bg-slate-500/10',
        nextStatus: null,
        actionLabel: null,
    },
    rejected: {
        label: 'Rejected',
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        nextStatus: null,
        actionLabel: null,
    },
};

/**
 * Build HTML for work order recap card content
 * 
 * @param {Object} order - Order data
 * @returns {string} - HTML string
 */
export function buildWorkOrderRecapCardHTML(order) {
    if (!order) {
        return `
            <div class="text-center py-12">
                <span class="material-symbols-outlined text-4xl text-slate-600 mb-3 block">touch_app</span>
                <p class="text-slate-500 text-sm">Select an order to see details</p>
            </div>
        `;
    }

    const { id, daily_number, status, time_slot, user, ingredients, created_at } = order;

    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const nickname = user?.nickname || 'Unknown';
    const timeLabel = time_slot 
        ? `${formatTime(time_slot.start_time)} - ${formatTime(time_slot.end_time)}`
        : '--:--';

    // Build ingredients section
    const ingredientsHTML = buildOrderIngredientsSectionHTML(ingredients, 'recap');

    return `
        <!-- Header -->
        <div class="flex items-start justify-between mb-6">
            <div>
                <h3 class="text-2xl font-bold text-white mb-1">Order #${daily_number}</h3>
                <span class="inline-block px-2 py-0.5 rounded-full ${config.bg} ${config.color} text-[10px] font-bold uppercase tracking-widest">
                    ${config.label}
                </span>
            </div>
        </div>

        <!-- User & Time -->
        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-slate-800/30 rounded-xl p-3">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Customer</p>
                <p class="text-sm text-white font-medium">${nickname}</p>
            </div>
            <div class="bg-slate-800/30 rounded-xl p-3">
                <p class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pickup Time</p>
                <p class="text-sm text-white font-medium">${timeLabel}</p>
            </div>
        </div>

        <!-- Ingredients -->
        <div class="mb-6">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ingredients</h4>
            <div class="bg-slate-800/30 rounded-xl p-4">
                ${ingredientsHTML}
            </div>
        </div>

        <!-- Action Button -->
        ${config.nextStatus ? `
            <button 
                type="button"
                class="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold uppercase transition-colors hover:bg-primary/90"
                data-action="change-status"
                data-order-id="${id}"
                data-new-status="${config.nextStatus}"
            >
                ${config.actionLabel}
            </button>
        ` : `
            <div class="w-full py-3 px-4 rounded-xl bg-slate-800/50 text-slate-500 font-bold uppercase text-center">
                Order Complete
            </div>
        `}
    `;
}

/**
 * Render recap card in container
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} order - Order data (null for empty state)
 * @param {Object} callbacks - Callbacks { onChangeStatus }
 */
export function renderWorkOrderRecapCard(container, order, callbacks) {
    if (!container) {
        console.warn('[WorkOrderRecapCard] Container is null');
        return;
    }

    const emptyEl = container.querySelector('[data-recap-empty]');
    const contentEl = container.querySelector('[data-recap-content]');

    if (!order) {
        // Show empty state
        if (emptyEl) emptyEl.classList.remove('hidden');
        if (contentEl) {
            contentEl.classList.add('hidden');
            contentEl.innerHTML = '';
        }
        return;
    }

    // Hide empty state, show content
    if (emptyEl) emptyEl.classList.add('hidden');
    if (contentEl) {
        contentEl.classList.remove('hidden');
        contentEl.innerHTML = buildWorkOrderRecapCardHTML(order);

        // Event listener for action button
        const actionBtn = contentEl.querySelector('[data-action="change-status"]');
        if (actionBtn && callbacks?.onChangeStatus) {
            actionBtn.addEventListener('click', () => {
                const orderId = parseInt(actionBtn.dataset.orderId, 10);
                const newStatus = actionBtn.dataset.newStatus;
                callbacks.onChangeStatus(orderId, newStatus);
            });
        }
    }

    console.log(`[WorkOrderRecapCard] Rendered order #${order.daily_number}`);
}

/**
 * Format time string from HH:mm:ss to HH:mm
 */
function formatTime(time) {
    if (!time) return '--:--';
    return time.substring(0, 5);
}

export default { buildWorkOrderRecapCardHTML, renderWorkOrderRecapCard };
