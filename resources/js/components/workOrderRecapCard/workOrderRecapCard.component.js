// Recap card for selected work order

import { buildOrderIngredientsSectionHTML } from '../orderIngredientsSection/orderIngredientsSection.component.js';
import { workServiceState } from '../../pages/admin-work-service/adminWorkService.state.js';
import { 
    ORDER_STATUS_CONFIG, 
    DROPDOWN_STATUSES, 
    getStatusMeta 
} from '../../config/orderStatus.config.js';

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

    // Always use the real order status (not visual override)
    const currentStatus = status;
    const statusMeta = getStatusMeta(currentStatus);
    const nickname = user?.nickname || 'Unknown';
    const timeLabel = time_slot 
        ? `${formatTime(time_slot.start_time)} - ${formatTime(time_slot.end_time)}`
        : '--:--';

    // Build ingredients section
    const ingredientsHTML = buildOrderIngredientsSectionHTML(ingredients, 'recap');

    // Build dropdown options
    const dropdownOptionsHTML = DROPDOWN_STATUSES.map(statusKey => {
        const optionMeta = getStatusMeta(statusKey);
        const isSelected = currentStatus === statusKey;
        
        // Define colors for each status
        const statusColors = {
            confirmed: { bg: 'rgba(59, 130, 246, 0.19)', color: 'rgb(59, 130, 246)' },
            ready: { bg: 'rgba(16, 185, 129, 0.19)', color: 'rgb(16, 185, 129)' },
            picked_up: { bg: 'rgba(107, 114, 128, 0.19)', color: 'rgb(107, 114, 128)' }
        };
        
        const colors = statusColors[statusKey] || statusColors.confirmed;
        
        return `
            <button 
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left ${isSelected ? 'bg-white/5' : ''}"
                data-action="select-status"
                data-status="${statusKey}"
                data-order-id="${id}"
                role="option"
                aria-selected="${isSelected}"
            >
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background-color: ${colors.bg};">
                    <span class="material-symbols-outlined text-base" style="color: ${colors.color};">${optionMeta.icon}</span>
                </div>
                <span class="text-white text-sm font-medium whitespace-nowrap">${optionMeta.label}</span>
                ${isSelected ? '<span class="material-symbols-outlined text-xs ml-auto text-slate-400">check</span>' : ''}
            </button>
        `;
    }).join('');

    return `
        <!-- Header with relative positioning for dropdown -->
        <div class="relative flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
                <span class="text-base font-bold text-white">${nickname} #${daily_number}</span>
                <button 
                    type="button"
                    class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${statusMeta.softBgClass} ${statusMeta.textClass} text-[10px] font-bold uppercase tracking-widest border border-transparent hover:border-white/20 transition-colors cursor-pointer"
                    data-action="toggle-status-dropdown"
                    aria-haspopup="listbox"
                    aria-expanded="${workServiceState.isStatusDropdownOpen}"
                    aria-label="Change order status"
                >
                    <span class="material-symbols-outlined text-sm">${statusMeta.icon}</span>
                    ${statusMeta.label}
                    <span class="material-symbols-outlined text-xs">${workServiceState.isStatusDropdownOpen ? 'expand_less' : 'expand_more'}</span>
                </button>
                
                <!-- Status Dropdown (inside header for proper positioning) -->
                <div 
                    class="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/20 rounded-xl shadow-2xl z-50 ${workServiceState.isStatusDropdownOpen ? '' : 'hidden'}"
                    data-status-dropdown
                    style="max-height: 180px; overflow-y: auto;"
                >
                    <div 
                        class="p-2"
                        role="listbox"
                    >
                        ${dropdownOptionsHTML}
                    </div>
                </div>
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

        <!-- Expandable Content -->
        <div class="${isExpanded ? '' : 'hidden'} transition-all duration-300">

        <!-- Ingredients -->
        <div class="mb-6">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Ingredients</h4>
            <div class="bg-slate-800/30 rounded-xl p-4">
                ${ingredientsHTML}
            </div>
        </div>

        <!-- Action Button (only if status can advance) -->
        ${statusMeta.nextStatus ? `
            <button 
                type="button"
                class="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold uppercase transition-colors hover:bg-primary/90"
                data-action="change-status"
                data-order-id="${id}"
                data-new-status="${statusMeta.nextStatus}"
            >
                ${statusMeta.actionLabel}
            </button>
        ` : ''}
        </div>
    `;
}

// Store callbacks globally to persist across re-renders
let _storedCallbacks = null;

/**
 * Setup event delegation on container (ONCE)
 * This persists across innerHTML updates
 */
function setupEventDelegation(container) {
    // Check if already setup
    if (container.dataset.delegationSetup === 'true') return;

    container.dataset.delegationSetup = 'true';

    container.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        e.preventDefault();
        e.stopPropagation();

        if (action === 'change-status') {
            const orderId = parseInt(target.dataset.orderId, 10);
            const newStatus = target.dataset.newStatus;
            if (_storedCallbacks?.onChangeStatus) _storedCallbacks.onChangeStatus(orderId, newStatus);
            return;
        }

        if (action === 'toggle-status-dropdown') {
            workServiceState.isStatusDropdownOpen = !workServiceState.isStatusDropdownOpen;
            const contentEl = container.querySelector('[data-recap-content]');
            const order = workServiceState.orders?.find(o => o.id === workServiceState.selectedOrderId);
            if (contentEl && order) contentEl.innerHTML = buildWorkOrderRecapCardHTML(order, workServiceState.recapCardExpanded);
            return;
        }

        if (action === 'select-status') {
            const orderId = parseInt(target.dataset.orderId, 10);
            const newStatus = target.dataset.status;
            workServiceState.isStatusDropdownOpen = false;
            if (_storedCallbacks?.onChangeStatus) _storedCallbacks.onChangeStatus(orderId, newStatus);
            return;
        }

        if (action === 'toggle-recap-expansion') {
            workServiceState.recapCardExpanded = !workServiceState.recapCardExpanded;
            const contentEl = container.querySelector('[data-recap-content]');
            const order = workServiceState.orders?.find(o => o.id === workServiceState.selectedOrderId);
            if (contentEl && order) contentEl.innerHTML = buildWorkOrderRecapCardHTML(order, workServiceState.recapCardExpanded);
            return;
        }
    });
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
    
    // Store callbacks for event delegation
    _storedCallbacks = callbacks;
    console.log('[WorkOrderRecapCard] 📦 Stored callbacks:', !!callbacks?.onChangeStatus);
    
    // Setup event delegation ONCE
    setupEventDelegation(container);

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
