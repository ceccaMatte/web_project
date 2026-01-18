/**
 * WORK ORDER CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza singola card ordine nella pipeline admin
 * - Mostra: numero ordine (badge), nickname utente, ingredienti abbreviati
 * - Layout su 2 righe con larghezza massima 120px
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
 * 
 * UTILIZZO:
 * buildWorkOrderCardHTML(order, isSelected)
 */

/**
 * Build HTML for work order card
 * 
 * @param {Object} order - Order data
 * @param {boolean} isSelected - Whether card is selected
 * @returns {string} - HTML string
 */
export function buildWorkOrderCardHTML(order, isSelected = false) {
    const { id, daily_number, status, time_slot, user, ingredients } = order;
    
    const nickname = user?.nickname || 'Unknown';
    const timeLabel = time_slot 
        ? `${formatTime(time_slot.start_time)}` 
        : '--:--';

    // Build ingredients preview (abbreviations)
    const ingredientsPreview = buildIngredientsPreview(ingredients);

    // Selected state styling
    const selectedClasses = isSelected 
        ? 'ring-2 ring-primary/60' 
        : 'ring-1 ring-primary/20';

    return `
        <div 
            class="p-2 bg-surface-dark border border-border-dark rounded-lg ${selectedClasses} transition-all cursor-pointer max-w-[120px]"
            data-order-card="${id}"
            data-action="select-order"
            data-order-id="${id}"
            role="button"
            tabindex="0"
            aria-label="Order #${daily_number} by ${nickname} at ${timeLabel}"
        >
            <!-- Prima riga: Badge numero ordine + Nickname -->
            <div class="flex items-center gap-1 mb-1">
                <span class="px-1.5 py-0.5 bg-primary/20 text-primary text-[8px] font-bold rounded">#${daily_number}</span>
                <span class="text-xs font-bold text-white truncate">${nickname}</span>
            </div>
            
            <!-- Seconda riga: Ingredienti abbreviati -->
            <div class="text-[8px] text-slate-400 truncate">
                ${ingredientsPreview || 'No ingredients'}
            </div>
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

    return codes.join(' ');
}

/**
 * Format time string from HH:mm:ss to HH:mm
 */
function formatTime(time) {
    if (!time) return '--:--';
    return time.substring(0, 5);
}

export default { buildWorkOrderCardHTML };
