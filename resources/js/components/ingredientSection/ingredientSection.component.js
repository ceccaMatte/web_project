/**
 * INGREDIENT SECTION COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza accordion per categoria ingredienti
 * - Usa <details>/<summary> per apertura/chiusura
 * - Contiene lista di IngredientItem
 * 
 * PROPS:
 * - category: string
 * - label: string
 * - icon: string (Material Symbol)
 * - items: Array<{id, name, category, available}>
 * - isOpen: boolean
 * - selectedIngredientIds: Set<number>
 * 
 * CALLBACKS:
 * - onToggle: (category) => void
 * - onIngredientSelect: (ingredient) => void
 * 
 * REGOLE:
 * - UNA SOLA sezione può essere aperta alla volta
 * - La logica apertura/chiusura è esterna (nelle actions)
 * - Il componente riceve isOpen e renderizza
 */

import { safeInnerHTML, listen } from '../../utils/dom.js';
import { renderIngredientItem } from '../ingredientItem/ingredientItem.component.js';

// Traccia listeners per evitare duplicati
const cleanupListeners = new Map();

/**
 * Renderizza singola sezione ingredienti (accordion).
 * 
 * @param {Object} section - { category, label, icon, items }
 * @param {boolean} isOpen - Se la sezione è aperta
 * @param {Set<number>} selectedIds - IDs ingredienti selezionati
 * @returns {string} HTML
 */
export function renderIngredientSectionHTML(section, isOpen, selectedIds) {
    const { category, label, icon, items } = section;

    // Genera HTML per ogni ingrediente
    const itemsHTML = items.map(item => {
        const selected = selectedIds.has(item.id);
        return renderIngredientItem({ ...item, selected });
    }).join('');

    const openAttr = isOpen ? 'open' : '';

    return `
        <details 
            class="group bg-card-dark border border-border-dark rounded-xl overflow-hidden"
            data-section-category="${category}"
            ${openAttr}
        >
            <summary 
                class="flex items-center justify-between px-4 py-3 cursor-pointer list-none"
                data-action="toggle-section"
                data-section-id="${category}"
            >
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-gray-400">${icon}</span>
                    <span class="text-[15px] font-semibold text-white">${label}</span>
                </div>
                <span class="material-symbols-outlined text-gray-500 transition-transform group-open:rotate-180">
                    expand_more
                </span>
            </summary>
            <div class="max-h-[280px] overflow-y-auto px-4 pb-4 space-y-3 border-t border-border-dark pt-4">
                ${itemsHTML}
            </div>
        </details>
    `;
}

/**
 * Renderizza tutte le sezioni ingredienti.
 * 
 * @param {HTMLElement} container - Container DOM
 * @param {Object} props - { sections, openSectionId, selectedIngredientIds }
 * @param {Object} callbacks - { onToggle, onIngredientSelect }
 */
export function renderIngredientSections(container, props, callbacks) {
    if (!container) return;

    const { sections, openSectionId, selectedIngredientIds } = props;
    const { onToggle, onIngredientSelect } = callbacks;

    // Crea Set per lookup veloce
    const selectedIds = new Set(selectedIngredientIds || []);

    // Genera HTML per tutte le sezioni
    const sectionsHTML = sections.map(section => {
        const isOpen = section.category === openSectionId;
        return renderIngredientSectionHTML(section, isOpen, selectedIds);
    }).join('');

    safeInnerHTML(container, sectionsHTML);

    // Cleanup listeners precedenti
    const prevCleanup = cleanupListeners.get(container);
    if (prevCleanup) {
        prevCleanup();
    }

    // Event delegation
    const cleanup = listen(container, 'click', (e) => {
        // Toggle sezione
        const summary = e.target.closest('[data-action="toggle-section"]');
        if (summary && onToggle) {
            e.preventDefault(); // Previeni comportamento default <details>
            const sectionId = summary.dataset.sectionId;
            onToggle(sectionId);
            return;
        }

        // Toggle ingrediente
        const ingredientEl = e.target.closest('[data-action="toggle-ingredient"]');
        if (ingredientEl && onIngredientSelect) {
            const ingredient = {
                id: parseInt(ingredientEl.dataset.ingredientId, 10),
                name: ingredientEl.dataset.ingredientName,
                category: ingredientEl.dataset.ingredientCategory,
                available: ingredientEl.dataset.ingredientAvailable === 'true',
            };
            onIngredientSelect(ingredient);
        }
    });

    cleanupListeners.set(container, cleanup);

    console.log(`[IngredientSections] Rendered (${sections.length} sections, open: ${openSectionId || 'none'})`);
}

export default { renderIngredientSections, renderIngredientSectionHTML };
