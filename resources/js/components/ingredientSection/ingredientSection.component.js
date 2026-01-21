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
 * PRINCIPIO SSOT:
 * - Riceve selectedIds dallo stato (via render.js)
 * - Determina se un ingrediente è selected SOLO confrontando con selectedIds
 * - NON legge mai lo stato checked dei checkbox esistenti nel DOM
 * - La UI risultante riflette SEMPRE e SOLO lo stato centralizzato
 * 
 * @param {Object} section - { category, label, icon, items }
 * @param {boolean} isOpen - Se la sezione è aperta
 * @param {Set<number>} selectedIds - IDs ingredienti selezionati (dallo STATO)
 * @returns {string} HTML
 */
export function renderIngredientSectionHTML(section, isOpen, selectedIds) {
    const { category, label, icon, items } = section;

    // Genera HTML per ogni ingrediente
    // SSOT: Lo stato checked/unchecked viene determinato QUI,
    // confrontando l'ID con gli IDs nello stato centralizzato
    const itemsHTML = items.map(item => {
        // Determina se selezionato SOLO dallo stato, mai dalla UI esistente
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
            const raw = {
                id: ingredientEl.dataset.ingredientId,
                name: ingredientEl.dataset.ingredientName,
                category: ingredientEl.dataset.ingredientCategory,
                available: ingredientEl.dataset.ingredientAvailable,
            };
            const ingredient = {
                id: raw.id ? parseInt(raw.id, 10) : null,
                name: raw.name,
                category: raw.category,
                available: String(raw.available) === 'true',
            };

            console.log('[IngredientSections] toggle-ingredient clicked', { raw, ingredient });

            try {
                onIngredientSelect(ingredient);
            } catch (err) {
                console.error('[IngredientSections] onIngredientSelect threw', err);
            }
        }
    });

    cleanupListeners.set(container, cleanup);

    console.log(`[IngredientSections] Rendered (${sections.length} sections, open: ${openSectionId || 'none'})`);
}

export default { renderIngredientSections, renderIngredientSectionHTML };
