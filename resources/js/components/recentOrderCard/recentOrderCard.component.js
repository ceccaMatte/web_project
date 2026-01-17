/**
 * RECENT ORDER CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Singola card ordine recente
 * - Mostra ingredienti, data, preferiti, reorder
 * 
 * REFERENCE DESIGN:
 * - Card con immagine 80x80
 * - Stella preferiti assoluta top-right
 * - Ingredienti con show more/less
 * - Bottone Reorder
 * 
 * PROPS:
 * - order: { id, date, time_slot, ingredients, is_favorite, ingredient_configuration_id }
 * - isExpanded: boolean
 * - dateLabel: string (già formattata, es. "Jan 15")
 * - labels: { showMore, showLess, reorder }
 * 
 * CALLBACKS:
 * - onToggleExpand: (orderId) => void
 * - onToggleFavorite: (orderId, configId) => void
 * - onReorder: (configId) => void
 */

/**
 * Build HTML for recent order card
 * 
 * @param {Object} props - Card props
 * @returns {string} - HTML string
 */
export function buildRecentOrderCardHTML(props) {
    const { order, isExpanded, dateLabel, labels } = props;
    const { id, time_slot, ingredients, is_favorite, ingredient_configuration_id } = order;
    
    const ingredientsList = ingredients || [];
    
    // Ingredienti come stringa
    const ingredientsText = ingredientsList.map(i => i.name).join(', ');
    
    // Show more/less se ci sono più di 3 ingredienti O il testo è lungo
    const hasMore = ingredientsList.length > 3 || ingredientsText.length > 50;
    const showFullList = isExpanded && hasMore;

    // Star fill style per preferiti
    const starFillStyle = is_favorite 
        ? 'style="font-variation-settings: \'FILL\' 1, \'wght\' 400, \'GRAD\' 0, \'opsz\' 24;"' 
        : '';

    return `
        <div class="bg-card-dark rounded-2xl p-5 border border-slate-800/80 shadow-sm relative min-h-[120px]" data-order-id="${id}">
            <button 
                class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 ${is_favorite ? 'text-yellow-500' : 'text-slate-400'} border border-slate-700/50 z-10 hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                data-action="toggle-favorite"
                data-order-id="${id}"
                data-config-id="${ingredient_configuration_id || ''}"
                aria-label="${is_favorite ? 'Remove from favorites' : 'Add to favorites'}"
                aria-pressed="${is_favorite}"
            >
                <span class="material-symbols-outlined text-base" aria-hidden="true" ${starFillStyle}>star</span>
            </button>
            
            <div class="flex gap-4 ${showFullList ? 'mb-4' : ''}">
                <div class="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700">
                    <div class="w-full h-full flex items-center justify-center">
                        <span class="material-symbols-outlined text-slate-400 text-3xl" aria-hidden="true">lunch_dining</span>
                    </div>
                </div>
                
                <div class="flex-grow pt-1 pr-8">
                    ${!showFullList ? `
                        <p class="text-[11px] font-medium text-slate-300 leading-relaxed mb-2 line-clamp-2">
                            ${ingredientsText || 'No ingredients'}
                        </p>
                        <div class="flex items-center justify-between mt-3">
                            ${hasMore ? `
                                <button 
                                    class="flex items-center gap-0.5 text-[9px] font-bold text-slate-500 uppercase focus:outline-none focus-visible:underline"
                                    data-action="toggle-expand"
                                    data-order-id="${id}"
                                    aria-expanded="false"
                                >
                                    ${labels.showMore} <span class="material-symbols-outlined text-[10px]" aria-hidden="true">expand_more</span>
                                </button>
                            ` : '<div></div>'}
                            <button 
                                class="text-[10px] font-bold text-primary border border-primary/30 px-5 py-2 rounded-xl uppercase hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                data-action="reorder"
                                data-order-id="${id}"
                                aria-label="Reorder this sandwich"
                            >
                                ${labels.reorder}
                            </button>
                        </div>
                    ` : `
                        <p class="text-[11px] font-medium text-slate-300 leading-relaxed">
                            ${ingredientsText}
                        </p>
                    `}
                </div>
            </div>
            
            ${showFullList ? `
                <div class="flex items-center justify-between pt-2 border-t border-slate-800/50">
                    <button 
                        class="flex items-center gap-0.5 text-[9px] font-bold text-primary uppercase focus:outline-none focus-visible:underline"
                        data-action="toggle-expand"
                        data-order-id="${id}"
                        aria-expanded="true"
                    >
                        ${labels.showLess} <span class="material-symbols-outlined text-[10px]" aria-hidden="true">expand_less</span>
                    </button>
                    <button 
                        class="text-[10px] font-bold text-primary border border-primary/30 px-5 py-2 rounded-xl uppercase hover:bg-primary/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        data-action="reorder"
                        data-order-id="${id}"
                        aria-label="Reorder this sandwich"
                    >
                        ${labels.reorder}
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

export default { buildRecentOrderCardHTML };
