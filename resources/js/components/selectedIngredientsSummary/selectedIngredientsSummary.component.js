import { safeInnerHTML, listen } from '../../utils/dom.js';

// Map per cleanup dei listener (due container possibili)
const cleanupListeners = new Map();
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
    let html = '<div class="bg-card-dark rounded-xl border border-border-dark overflow-hidden flex flex-col max-h-60 md:max-h-96">';
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

    // Cleanup previous listener for this container
    const prevCleanup = cleanupListeners.get(container);
    if (prevCleanup) prevCleanup();

    if (onRemove) {
        const cleanup = listen(container, 'click', (e) => {
            const button = e.target.closest('[data-action="remove-ingredient"]');
            if (!button) return;

            const rawId = button.dataset.ingredientId;
            const ingredientId = rawId ? parseInt(rawId, 10) : null;
            if (ingredientId === null) return;

            try {
                onRemove(ingredientId);
            } catch (err) {
                console.error(err);
            }
        });

        cleanupListeners.set(container, cleanup);
    }
}

export default { renderSelectedIngredientsSummary };
