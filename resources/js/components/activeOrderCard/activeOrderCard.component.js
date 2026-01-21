import { getStatusClasses } from '../../config/orderStatus.config.js';
/**
 * ACTIVE ORDER CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Singola card ordine attivo
 * - Supporta due modalità: "active" (card principale) e "side" (card laterale preview)
 * 
 * REFERENCE DESIGN:
 * - Active: card grande con status, time, immagine, ingredienti, show more, modify button
 * - Side: card piccola, grayscale, opacity, no modify button
 * 
 * PROPS:
 * - order: { id, status, time_slot, is_modifiable, ingredients, is_favorite, ingredient_configuration_id }
 * - mode: 'active' | 'side'
 * - isExpanded: boolean
 * - statusLabel: string (già calcolato)
 * - statusColors: { bg, text }
 * - ingredientsPreview: string (testo ingredienti per preview, es. "Sourdough, Cheddar, Ham...")
 * 
 * CALLBACKS:
 * - onToggleExpand: (orderId) => void
 * - onToggleFavorite: (orderId, configId) => void
 * - onModify: (orderId) => void
 * 
 * NOTE: Il componente NON decide logica (es. pending → mostra modify).
 * Riceve is_modifiable già calcolato nelle props.
 */

/**
 * Build HTML for active order card
 * 
 * @param {Object} props - Card props
 * @param {Object} callbacks - Event callbacks
 * @returns {string} - HTML string
 */
export function buildActiveOrderCardHTML(props, callbacks) {
    const { 
        order, 
        mode, 
        isExpanded, 
        statusLabel, 
        statusColors,
        ingredientsPreview,
        showMoreLabel,
        showLessLabel,
        modifyLabel
    } = props;

    const { id, time_slot, is_modifiable, ingredients, is_favorite, ingredient_configuration_id } = order;
    
    const isActiveMode = mode === 'active';
    const isSideMode = mode === 'side';

    // =========================================================================
    // SIDE MODE (Preview card laterale)
    // =========================================================================
    if (isSideMode) {
        return `
            <div class="carousel-card carousel-card-side" data-order-id="${id}" data-mode="side">
                <div class="bg-card-dark rounded-xl p-3 border border-slate-800">
                    <div class="h-12 w-full rounded-lg overflow-hidden mb-2 bg-slate-800 flex items-center justify-center grayscale opacity-50">
                        <img src="/img/panino.png" alt="Panino" class="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        `;
    }

        // =========================================================================
        // ACTIVE MODE (Card principale) - Nuovo markup e logica
        // =========================================================================
        const previewCount = 3;
        const ingredientsList = ingredients || [];
        const hasMore = ingredientsList.length > previewCount;
        const ingredientsText = ingredientsList.map(i => i.name).join(', ');
        const showIngredients = isExpanded;
        const isPending = statusLabel && statusLabel.toLowerCase() === 'pending';

            // Ottengo la palette badgeClass dallo stato ordine
            const badgeClass = getStatusClasses(order.status).badgeClass;
        return `
            <div class="carousel-card carousel-card-active" data-order-id="${id}" data-mode="active">
                <div class="bg-card-dark rounded-[2.5rem] p-7 border border-slate-800 relative overflow-hidden">
                    <div class="flex justify-between items-center mb-6">
                        <span class="px-4 py-1.5 rounded-full ${badgeClass} text-[11px] font-bold uppercase tracking-widest">
                            ${statusLabel}
                        </span>
                        <span class="text-[12px] font-medium text-slate-400">${formatTimeSlot(time_slot)}</span>
                    </div>
                    <div class="w-full aspect-square rounded-[2rem] overflow-hidden bg-slate-800 mb-6 shadow-2xl ring-4 ring-white/5">
                        <img alt="Order Item" class="w-full h-full object-cover" src="./img/panino.png" />
                    </div>
                    <div class="text-center ${isPending ? 'mb-6' : ''}">
                        <h3 class="text-lg font-bold text-slate-100 uppercase tracking-wide mb-2">${order.name || 'Campus Melt'}</h3>
                        ${!showIngredients ? `
                            <p class="text-[12px] text-slate-400 line-clamp-2 px-2 leading-relaxed">${ingredientsText || 'No ingredients'}</p>
                        ` : `
                            <div class="flex flex-wrap justify-center gap-1 mb-2">
                                ${ingredientsList.map(ing => `<span class="inline-block text-[11px] px-2 py-1 bg-slate-800 rounded text-slate-400">${ing.name}</span>`).join('')}
                            </div>
                        `}
                        <button 
                            class="mt-2 flex items-center gap-1 text-[11px] font-bold text-primary uppercase focus:outline-none focus-visible:underline mx-auto"
                            data-action="toggle-expand"
                            data-order-id="${id}"
                            aria-expanded="${showIngredients ? 'true' : 'false'}"
                        >
                            ${showIngredients ? showLessLabel : showMoreLabel}
                            <span class="material-symbols-outlined text-[12px]" aria-hidden="true">${showIngredients ? 'expand_less' : 'expand_more'}</span>
                        </button>
                    </div>
                    ${isPending ? `
                        <button class="w-full bg-primary text-white text-[11px] font-bold uppercase py-4 rounded-2xl active:scale-95 transition-transform shadow-xl shadow-primary/20" data-action="modify-order" data-order-id="${id}" aria-label="${modifyLabel}">
                            ${modifyLabel}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
}

/**
 * Format time slot for display
 * @param {string} timeSlot - Time in format "HH:mm:ss" or "HH:mm"
 * @returns {string} - Formatted time "HH:MM AM/PM"
 */
function formatTimeSlot(timeSlot) {
    if (!timeSlot) return '';
    
    try {
        // Handle "HH:mm:ss" or "HH:mm" format
        const parts = timeSlot.split(':');
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        // const ampm = hours >= 12 ? 'PM' : 'AM';
        // hours = hours % 12 || 12;
        // return `${hours}:${minutes} ${ampm}`;
        return `${hours}:${minutes}`;

    } catch {
        return timeSlot;
    }
}

export default { buildActiveOrderCardHTML };
