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
import { workServiceState } from '../../pages/admin-work-service/adminWorkService.state.js';

// Status configuration
const STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        icon: 'schedule',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        nextStatus: 'confirmed',
        actionLabel: 'Confirm',
    },
    confirmed: {
        label: 'Confirmed',
        icon: 'check_circle',
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        nextStatus: 'ready',
        actionLabel: 'Mark Ready',
    },
    ready: {
        label: 'Ready',
        icon: 'schedule',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        nextStatus: 'picked_up',
        actionLabel: 'Mark Picked Up',
    },
    picked_up: {
        label: 'Picked Up',
        icon: 'done_all',
        color: 'text-slate-400',
        bg: 'bg-slate-500/10',
        nextStatus: null,
        actionLabel: null,
    },
    rejected: {
        label: 'Rejected',
        icon: 'cancel',
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
 * @param {boolean} isExpanded - Whether the card is expanded
 * @returns {string} - HTML string
 */
export function buildWorkOrderRecapCardHTML(order, isExpanded = true) {
    if (!order) {
        return `
            <div class="text-center py-12">
                <span class="material-symbols-outlined text-4xl text-slate-600 mb-3 block">touch_app</span>
                <p class="text-slate-500 text-sm">Select an order to see details</p>
            </div>
        `;
    }

    const { id, daily_number, status, time_slot, user, ingredients, created_at } = order;

    // Use visual status for display (from dropdown selection)
    const visualStatus = workServiceState.selectedOrderStatus || status;
    const config = STATUS_CONFIG[visualStatus] || STATUS_CONFIG.pending;
    const nickname = user?.nickname || 'Unknown';
    const timeLabel = time_slot 
        ? `${formatTime(time_slot.start_time)} - ${formatTime(time_slot.end_time)}`
        : '--:--';

    // Build ingredients section
    const ingredientsHTML = buildOrderIngredientsSectionHTML(ingredients, 'recap');

    return `
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
                <span class="text-base font-bold text-white">${nickname} #${daily_number}</span>
                <button 
                    type="button"
                    class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bg} ${config.color} text-[10px] font-bold uppercase tracking-widest border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                    data-action="toggle-status-dropdown"
                    aria-haspopup="listbox"
                    aria-expanded="${workServiceState.isStatusDropdownOpen}"
                    aria-label="Change order status"
                >
                    <span class="material-symbols-outlined text-sm">${config.icon}</span>
                    ${config.label}
                    <span class="material-symbols-outlined text-xs">expand_more</span>
                </button>
            </div>
            <button 
                type="button"
                class="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                data-action="toggle-recap-expansion"
                aria-label="${isExpanded ? 'Collapse' : 'Expand'} order details"
                title="${isExpanded ? 'Collapse' : 'Expand'} order details"
            >
                <span class="material-symbols-outlined text-lg">${isExpanded ? 'expand_less' : 'expand_more'}</span>
            </button>
        </div>

        <!-- Status Dropdown -->
        <div 
            class="relative ${workServiceState.isStatusDropdownOpen ? '' : 'hidden'}"
            data-status-dropdown
        >
            <div 
                class="absolute top-2 left-0 z-50 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1"
                role="listbox"
            >
                ${['confirmed', 'ready', 'picked_up'].map(statusKey => {
                    const optionConfig = STATUS_CONFIG[statusKey];
                    const isSelected = visualStatus === statusKey;
                    return `
                        <button 
                            type="button"
                            class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700/50 transition-colors ${isSelected ? 'bg-slate-700/30 font-medium' : ''}"
                            data-action="select-status"
                            data-status="${statusKey}"
                            role="option"
                            aria-selected="${isSelected}"
                        >
                            <span class="material-symbols-outlined text-base ${optionConfig.color}">${optionConfig.icon}</span>
                            <span class="${optionConfig.color}">${optionConfig.label}</span>
                            ${isSelected ? '<span class="material-symbols-outlined text-xs ml-auto text-slate-400">check</span>' : ''}
                        </button>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- Expandable Content -->
        <div class="${isExpanded ? '' : 'hidden'} transition-all duration-300">

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
        </div>
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

    // Check if recap card should be visible
    if (!workServiceState.recapCardVisible) {
        container.classList.add('hidden');
        return;
    } else {
        container.classList.remove('hidden');
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
        contentEl.innerHTML = buildWorkOrderRecapCardHTML(order, workServiceState.recapCardExpanded);

        // Event listener for action button
        const actionBtn = contentEl.querySelector('[data-action="change-status"]');
        if (actionBtn && callbacks?.onChangeStatus) {
            actionBtn.addEventListener('click', () => {
                const orderId = parseInt(actionBtn.dataset.orderId, 10);
                const newStatus = actionBtn.dataset.newStatus;
                callbacks.onChangeStatus(orderId, newStatus);
            });
        }

        // Event listener for toggle expansion button
        const toggleBtn = contentEl.querySelector('[data-action="toggle-recap-expansion"]');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                workServiceState.recapCardExpanded = !workServiceState.recapCardExpanded;
                // Re-render to update the expansion state
                renderWorkOrderRecapCard(container, order, callbacks);
                console.log(`[WorkOrderRecapCard] Recap card ${workServiceState.recapCardExpanded ? 'expanded' : 'collapsed'}`);
            });
        }

        // Event listener for status dropdown toggle
        const dropdownBtn = contentEl.querySelector('[data-action="toggle-status-dropdown"]');
        if (dropdownBtn) {
            dropdownBtn.addEventListener('click', () => {
                workServiceState.isStatusDropdownOpen = !workServiceState.isStatusDropdownOpen;
                renderWorkOrderRecapCard(container, order, callbacks);
            });
        }

        // Event listeners for status options
        const statusOptions = contentEl.querySelectorAll('[data-action="select-status"]');
        statusOptions.forEach(option => {
            option.addEventListener('click', () => {
                const newStatus = option.dataset.status;
                workServiceState.selectedOrderStatus = newStatus;
                workServiceState.isStatusDropdownOpen = false;
                renderWorkOrderRecapCard(container, order, callbacks);
            });
        });

        // Close dropdown on outside click if open
        if (workServiceState.isStatusDropdownOpen) {
            const handleOutsideClick = (e) => {
                if (!contentEl.contains(e.target)) {
                    workServiceState.isStatusDropdownOpen = false;
                    renderWorkOrderRecapCard(container, order, callbacks);
                    document.removeEventListener('click', handleOutsideClick);
                }
            };
            // Delay to avoid immediate trigger on button click
            setTimeout(() => document.addEventListener('click', handleOutsideClick), 0);
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
