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
 * Mappa categoria → label UI
 */
function getCategoryLabel(category) {
    const labels = {
        'bread': 'Bread',
        'meat': 'Protein',
        'cheese': 'Cheese',
        'vegetable': 'Toppings',
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
    
    // Genera HTML
    let html = '<div class="bg-card-dark rounded-2xl border border-border-dark p-4 space-y-4">';
    
    let isFirst = true;
    categoryOrder.forEach(category => {
        if (!grouped[category]) return;
        
        grouped[category].forEach(ing => {
            const dividerClass = isFirst ? '' : 'border-t border-border-dark pt-4';
            
            html += `
                <div class="flex items-center justify-between ${dividerClass}">
                    <div>
                        <p class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            ${getCategoryLabel(category)}
                        </p>
                        <p class="text-[15px] font-semibold text-white">
                            ${ing.name}
                        </p>
                    </div>
                    <button 
                        type="button"
                        class="text-red-500 hover:text-red-400 active:scale-95 transition-all"
                        data-action="remove-ingredient"
                        data-ingredient-id="${ing.id}"
                        aria-label="Rimuovi ${ing.name}"
                    >
                        <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1">
                            do_not_disturb_on
                        </span>
                    </button>
                </div>
            `;
            
            isFirst = false;
        });
    });
    
    html += '</div>';
    
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
