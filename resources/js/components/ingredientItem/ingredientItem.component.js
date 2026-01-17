/**
 * INGREDIENT ITEM COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza singolo ingrediente
 * - Stati: available+selected, available+unselected, unavailable (out of stock)
 * 
 * PROPS:
 * - id: number
 * - name: string
 * - category: string
 * - available: boolean
 * - selected: boolean
 * 
 * CALLBACKS:
 * - onSelect: (ingredient) => void
 * 
 * STATI CONSENTITI (da specifica):
 * - available=true, selected=true → selezionato
 * - available=true, selected=false → selezionabile
 * - available=false → out of stock (non cliccabile)
 * 
 * ❌ NON ESISTE disabled
 */

/**
 * Renderizza HTML per singolo ingrediente.
 * 
 * @param {Object} ingredient - { id, name, category, available, selected }
 * @returns {string} HTML
 */
export function renderIngredientItem(ingredient) {
    const { id, name, category, available, selected } = ingredient;

    if (!available) {
        // OUT OF STOCK
        return `
            <div 
                class="flex items-center justify-between opacity-40"
                data-ingredient-id="${id}"
                aria-disabled="true"
            >
                <span class="text-sm text-gray-400">${name}</span>
                <span class="text-[9px] font-bold text-red-500 uppercase border border-red-500/30 px-1.5 py-0.5 rounded">
                    Out of Stock
                </span>
            </div>
        `;
    }

    if (selected) {
        // SELEZIONATO
        return `
            <div 
                class="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 -mx-4 px-4 py-1 rounded transition-colors"
                data-ingredient-id="${id}"
                data-ingredient-name="${name}"
                data-ingredient-category="${category}"
                data-ingredient-available="true"
                data-action="toggle-ingredient"
                role="button"
                tabindex="0"
                aria-pressed="true"
                aria-label="${name}, selezionato"
            >
                <span class="text-sm text-white">${name}</span>
                <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1">
                    check_circle
                </span>
            </div>
        `;
    }

    // DISPONIBILE NON SELEZIONATO
    return `
        <div 
            class="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 -mx-4 px-4 py-1 rounded transition-colors"
            data-ingredient-id="${id}"
            data-ingredient-name="${name}"
            data-ingredient-category="${category}"
            data-ingredient-available="true"
            data-action="toggle-ingredient"
            role="button"
            tabindex="0"
            aria-pressed="false"
            aria-label="${name}, disponibile"
        >
            <span class="text-sm text-gray-300">${name}</span>
            <div class="w-6 h-6 rounded-full border-2 border-border-dark"></div>
        </div>
    `;
}

export default { renderIngredientItem };
