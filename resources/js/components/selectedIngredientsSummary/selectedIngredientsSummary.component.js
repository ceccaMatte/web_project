/**
 * SELECTED INGREDIENTS SUMMARY COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Mostra ingredienti selezionati raggruppati per categoria
 * - Permette rimozione singolo ingrediente
 * 
 * PROPS:
 * - selectedIngredients: Array<{id, name, category}>
 * 
 * CALLBACKS:
 * - onRemove: (ingredientId) => void
 * 
 * UI: Segue esattamente createOrder.html reference
 */

import { safeInnerHTML, listen } from '../../utils/dom.js';

// Traccia listener per evitare duplicati
let cleanupListener = null;

/**
 * Mappa categoria → label UI (DEVE matchare config backend)
 */
function getCategoryLabel(category) {
    const labels = {
        'bread': 'Bread',
        'meat': 'Protein',
        'cheese': 'Cheese',
        'vegetable': 'Veggies',
        'sauce': 'Sauce',
        'other': 'Extras',
    };
    return labels[category] || category;
}

/**
 * Renderizza il riepilogo ingredienti selezionati.
 * 
 * @param {HTMLElement} container - Container DOM
 * @param {Object} props - { selectedIngredients }
 * @param {Object} callbacks - { onRemove }
 */
export function renderSelectedIngredientsSummary(container, props, callbacks) {
    if (!container) return;

    const { selectedIngredients } = props;
    const { onRemove } = callbacks;

    // Se nessun ingrediente selezionato, mostra messaggio
    if (!selectedIngredients || selectedIngredients.length === 0) {
        safeInnerHTML(container, `
            <div class="bg-card-dark rounded-2xl border border-border-dark p-4">
                <p class="text-slate-500 text-sm text-center">
                    No ingredients selected yet
                </p>
            </div>
        `);
        return;
    }

    // Raggruppa per categoria
    const grouped = {};
    selectedIngredients.forEach(ing => {
        if (!grouped[ing.category]) {
            grouped[ing.category] = [];
        }
        grouped[ing.category].push(ing);
    });

    // Ordine categorie
    const categoryOrder = ['bread', 'meat', 'cheese', 'vegetable', 'sauce', 'other'];
    
    // Genera HTML - container con max-height e scroll
    // Raggruppa ingredienti: HEADER categoria UNA VOLTA, poi lista ingredienti sotto
    let html = '<div class="bg-card-dark rounded-xl border border-border-dark overflow-hidden flex flex-col max-h-60">';
    html += '<div class="overflow-y-auto no-scrollbar p-4 flex flex-col gap-4">';
    
    let isFirstCategory = true;
    categoryOrder.forEach(category => {
        if (!grouped[category] || grouped[category].length === 0) return;
        
        // Divider tra categorie (non prima della prima)
        const dividerClass = isFirstCategory ? '' : 'border-t border-border-dark pt-4';
        
        html += `<div class="${dividerClass}">`;
        
        // Header categoria UNA VOLTA
        html += `
            <p class="text-[10px] text-primary font-bold uppercase tracking-tight mb-2">
                ${getCategoryLabel(category)}
            </p>
        `;
        
        // Lista ingredienti sotto la categoria
        grouped[category].forEach(ing => {
            html += `
                <div class="flex items-center justify-between py-1">
                    <p class="text-[15px] font-medium text-white">
                        ${ing.name}
                    </p>
                    <button 
                        type="button"
                        class="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 active:bg-red-500/20 transition-all"
                        data-action="remove-ingredient"
                        data-ingredient-id="${ing.id}"
                        aria-label="Rimuovi ${ing.name}"
                    >
                        <span class="material-symbols-outlined text-lg">remove</span>
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        isFirstCategory = false;
    });
    
    html += '</div></div>';
    
    safeInnerHTML(container, html);

    // Cleanup listener precedente
    if (cleanupListener) {
        cleanupListener();
    }

    // Event delegation per rimozione
    if (onRemove) {
        cleanupListener = listen(container, 'click', (e) => {
            const button = e.target.closest('[data-action="remove-ingredient"]');
            if (button) {
                const ingredientId = parseInt(button.dataset.ingredientId, 10);
                onRemove(ingredientId);
            }
        });
    }

    console.log(`[SelectedIngredientsSummary] Rendered (${selectedIngredients.length} ingredients)`);
}

export default { renderSelectedIngredientsSummary };
