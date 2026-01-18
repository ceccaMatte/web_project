/**
 * WORK ORDER CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza singola card ordine nella pipeline admin
 * - Mostra: numero ordine, nickname utente, time slot, ingredienti abbreviati
 * - Bottone azione per avanzare stato
 * 
 * PROPS:
 * - order: { id, daily_number, status, time_slot, user, ingredients }
 *   - user: { id, nickname }
 *   - time_slot: { start_time, end_time }
 *   - ingredients: { bread: [...], meat: [...], ... } (grouped by category)
 * - isSelected: boolean (per highlight)
 * 
 * CALLBACKS:
 * - onSelect: (orderId) => void
 * - onChangeStatus: (orderId, newStatus) => void
 * 
 * UTILIZZO:
 * buildWorkOrderCardHTML(order, isSelected)
 */

// Status transitions
const STATUS_TRANSITIONS = {
    confirmed: 'ready',
    ready: 'picked_up',
};

// Action button labels
const ACTION_LABELS = {
    confirmed: 'Mark Ready',
    ready: 'Mark Picked Up',
};

// Status colors
const STATUS_COLORS = {
    confirmed: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        action: 'bg-blue-500 hover:bg-blue-600',
    },
    ready: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        action: 'bg-emerald-500 hover:bg-emerald-600',
    },
    picked_up: {
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30',
        text: 'text-slate-400',
        action: '',
    },
};

/**
 * Build HTML for work order card
 * 
 * @param {Object} order - Order data
 * @param {boolean} isSelected - Whether card is selected
 * @returns {string} - HTML string
 */
export function buildWorkOrderCardHTML(order, isSelected = false) {
    const { id, daily_number, status, time_slot, user, ingredients } = order;

    const colors = STATUS_COLORS[status] || STATUS_COLORS.confirmed;
    const nextStatus = STATUS_TRANSITIONS[status];
    const actionLabel = ACTION_LABELS[status];
    
    const nickname = user?.nickname || 'Unknown';
    const timeLabel = time_slot 
        ? `${formatTime(time_slot.start_time)}` 
        : '--:--';

    // Build ingredients preview (abbreviations)
    const ingredientsPreview = buildIngredientsPreview(ingredients);

    // Selected state styling - più evidente
    const selectedClasses = isSelected 
        ? 'ring-2 ring-primary/60 shadow-xl shadow-primary/30 border-primary/40' 
        : '';

    // Card classes
    const cardClasses = `
        relative p-4 rounded-xl border transition-all cursor-pointer
        ${colors.bg} ${colors.border} ${selectedClasses}
        hover:border-opacity-60
    `.trim().replace(/\s+/g, ' ');

    return `
        <div 
            class="${cardClasses}"
            data-order-card="${id}"
            data-action="select-order"
            data-order-id="${id}"
            role="button"
            tabindex="0"
            aria-label="Order #${daily_number} by ${nickname} at ${timeLabel}"
        >
            <!-- Header: Order number + Time -->
            <div class="flex items-center justify-between mb-2">
                <span class="text-white font-bold text-lg">#${daily_number}</span>
                <span class="text-[10px] text-slate-500 uppercase tracking-wider">${timeLabel}</span>
            </div>
            
            <!-- User nickname -->
            <p class="text-sm ${colors.text} font-medium mb-3">${nickname}</p>
            
            <!-- Ingredients preview -->
            <p class="text-[10px] text-slate-500 line-clamp-2 mb-4">
                ${ingredientsPreview || 'No ingredients'}
            </p>
            
            <!-- Action button (if has next status) -->
            ${nextStatus ? `
                <button 
                    type="button"
                    class="w-full py-2 px-3 rounded-lg text-white text-xs font-bold uppercase transition-colors ${colors.action}"
                    data-action="change-status"
                    data-order-id="${id}"
                    data-new-status="${nextStatus}"
                    aria-label="${actionLabel} for order #${daily_number}"
                >
                    ${actionLabel}
                </button>
            ` : `
                <div class="w-full py-2 px-3 rounded-lg bg-slate-800/50 text-slate-500 text-xs font-bold uppercase text-center">
                    Completed
                </div>
            `}
        </div>
    `;
}

/**
 * Build ingredients preview from grouped ingredients
 * Uses 'code' field for abbreviations
 * 
 * @param {Object} ingredients - Grouped ingredients { bread: [...], meat: [...] }
 * @returns {string} - Preview string
 */
function buildIngredientsPreview(ingredients) {
    if (!ingredients || typeof ingredients !== 'object') return '';

    const codes = [];
    const categoryOrder = ['bread', 'meat', 'cheese', 'vegetable', 'sauce', 'other'];

    for (const category of categoryOrder) {
        if (ingredients[category] && Array.isArray(ingredients[category])) {
            for (const ing of ingredients[category]) {
                if (ing.code) {
                    codes.push(ing.code);
                }
            }
        }
    }

    return codes.join(' • ');
}

/**
 * Format time string from HH:mm:ss to HH:mm
 */
function formatTime(time) {
    if (!time) return '--:--';
    return time.substring(0, 5);
}

export default { buildWorkOrderCardHTML };
