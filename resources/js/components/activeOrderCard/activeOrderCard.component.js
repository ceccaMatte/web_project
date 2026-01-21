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
    // ACTIVE MODE (Card principale)
    // =========================================================================
    
    // Ingredienti: preview truncata o lista completa
    const previewCount = 3;
    const ingredientsList = ingredients || [];
    const ingredientsToShow = isExpanded ? ingredientsList : ingredientsList.slice(0, previewCount);
    const hasMore = ingredientsList.length > previewCount;
    
    // Build ingredienti stringa per line-clamp
    const ingredientsText = ingredientsList.map(i => i.name).join(', ');
    const showIngredientsAsTags = isExpanded;

    return `
        <div class="carousel-card carousel-card-active" data-order-id="${id}" data-mode="active">
            <div class="bg-card-dark rounded-2xl p-4 border border-slate-800 relative overflow-hidden">
                <div class="flex justify-between items-center mb-3">
                    <span class="px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text} text-[9px] font-bold uppercase tracking-widest">
                        ${statusLabel}
                    </span>
                    <span class="text-[9px] font-medium text-slate-400">${formatTimeSlot(time_slot)}</span>
                </div>
                
                <div class="flex gap-3 items-start mb-4">
                        <div class="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 shadow-lg ring-1 ring-white/10 shrink-0 relative flex items-center justify-center">
                            <img src="/img/panino.png" alt="Panino" class="w-full h-full object-cover" />
                        </div>
                    <div class="flex-grow min-w-0">
                        ${!isExpanded ? `
                            <p class="text-[10px] text-slate-400 leading-relaxed line-clamp-3">
                                ${ingredientsText || 'No ingredients'}
                            </p>
                            ${hasMore ? `
                                <button 
                                    class="mt-1 flex items-center gap-1 text-[9px] font-bold text-primary uppercase focus:outline-none focus-visible:underline"
                                    data-action="toggle-expand"
                                    data-order-id="${id}"
                                    aria-expanded="false"
                                >
                                    ${showMoreLabel} <span class="material-symbols-outlined text-[10px]" aria-hidden="true">expand_more</span>
                                </button>
                            ` : ''}
                        ` : `
                            <div class="space-y-1">
                                ${ingredientsList.map(ing => `
                                    <span class="inline-block text-[9px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 mr-1">
                                        ${ing.name}
                                    </span>
                                `).join('')}
                            </div>
                            <button 
                                class="mt-2 flex items-center gap-1 text-[9px] font-bold text-primary uppercase focus:outline-none focus-visible:underline"
                                data-action="toggle-expand"
                                data-order-id="${id}"
                                aria-expanded="true"
                            >
                                ${showLessLabel} <span class="material-symbols-outlined text-[10px]" aria-hidden="true">expand_less</span>
                            </button>
                        `}
                    </div>
                </div>
                
                ${is_modifiable ? `
                    <button 
                        class="w-full bg-primary text-white text-[10px] font-bold uppercase py-2.5 rounded-xl active:scale-95 transition-transform shadow-lg shadow-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        data-action="modify-order"
                        data-order-id="${id}"
                        aria-label="${modifyLabel}"
                    >
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
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    } catch {
        return timeSlot;
    }
}

export default { buildActiveOrderCardHTML };
