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
// IMPORTANTE: Usa Map perché abbiamo DUE container (mobile + desktop)
const cleanupListeners = new Map();

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
    console.log('[SelectedIngredientsSummary] ========== RENDER START ==========');
    console.log('[SelectedIngredientsSummary] Container:', container);
    console.log('[SelectedIngredientsSummary] Container exists:', !!container);
    console.log('[SelectedIngredientsSummary] Props:', props);
    console.log('[SelectedIngredientsSummary] Callbacks:', callbacks);
    console.log('[SelectedIngredientsSummary] onRemove type:', typeof callbacks?.onRemove);
    
    if (!container) {
        console.error('[SelectedIngredientsSummary] ❌ Container is null/undefined - ABORTING');
        return;
    }

    console.log('[SelectedIngredientsSummary] render called', {
        container,
        selectedCount: props?.selectedIngredients?.length || 0,
        callbacksPresent: {
            onRemove: typeof callbacks?.onRemove === 'function'
        }
    });

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
    console.log('[SelectedIngredientsSummary] ✅ safeInnerHTML applied, HTML length:', html.length);
    
    // Verifica che i pulsanti siano stati creati
    const buttons = container.querySelectorAll('[data-action="remove-ingredient"]');
    console.log('[SelectedIngredientsSummary] Remove buttons found:', buttons.length);
    buttons.forEach((btn, idx) => {
        console.log(`  Button ${idx}:`, {
            id: btn.dataset.ingredientId,
            visible: btn.offsetParent !== null
        });
    });

    // Cleanup listener precedente PER QUESTO CONTAINER
    const prevCleanup = cleanupListeners.get(container);
    if (prevCleanup) {
        console.log('[SelectedIngredientsSummary] Cleaning up previous listener for this container');
        prevCleanup();
    }

    // Event delegation per rimozione
    // PRINCIPIO SSOT: Il componente NON modifica lo stato direttamente
    // Delega la logica alla callback onRemove (che è deselectIngredient in actions.js)
    console.log('[SelectedIngredientsSummary] onRemove check:', {
        exists: !!onRemove,
        type: typeof onRemove,
        isFunction: typeof onRemove === 'function'
    });
    
    if (onRemove) {
        console.log('[SelectedIngredientsSummary] ✅ Attaching remove listener to container');
        console.log('[SelectedIngredientsSummary] Container element:', container.tagName, container.className);
        
        const cleanup = listen(container, 'click', (e) => {
            console.log('[SelectedIngredientsSummary] 🖱️ CLICK EVENT DETECTED on container!');
            console.log('[SelectedIngredientsSummary] Event target:', e.target);
            console.log('[SelectedIngredientsSummary] Event target classes:', e.target.className);
            
            const button = e.target.closest('[data-action="remove-ingredient"]');
            console.log('[SelectedIngredientsSummary] Closest button found:', !!button);
            
            if (button) {
                console.log('[SelectedIngredientsSummary] ✅ Remove button clicked!', {
                    dataset: button.dataset,
                    text: button.textContent?.trim(),
                });

                const rawId = button.dataset.ingredientId;
                const ingredientId = rawId ? parseInt(rawId, 10) : null;

                // Log semplice richiesto: verifica click sul meno
                console.log('[SelectedIngredientsSummary] elemento cancella elemento', { ingredientId });

                if (!ingredientId && ingredientId !== 0) {
                    console.error('[SelectedIngredientsSummary] Invalid ingredientId on button', rawId);
                    return;
                }

                console.log('[SelectedIngredientsSummary] Calling onRemove with id', ingredientId, 'onRemove present?', typeof onRemove === 'function');

                // Chiama la callback che gestirà:
                // 1. Aggiornamento stato
                // 2. Re-render completo
                // 3. Sincronizzazione automatica con "Add Ingredients"
                try {
                    onRemove(ingredientId);
                } catch (err) {
                    console.error('[SelectedIngredientsSummary] onRemove threw error', err);
                }
            }
        });
        
        // Salva cleanup nella Map associata a questo container
        cleanupListeners.set(container, cleanup);
        
        console.log('[SelectedIngredientsSummary] ✅ Event listener ATTACHED successfully');
    } else {
        console.error('[SelectedIngredientsSummary] ❌ onRemove callback is MISSING - event listener NOT attached!');
    }

    console.log(`[SelectedIngredientsSummary] ========== RENDER COMPLETE (${selectedIngredients.length} ingredients) ==========`);
}

export default { renderSelectedIngredientsSummary };
