/**
 * ACTION FOOTER COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza footer con bottoni azione
 * - Submit (Create/Save) + Delete (solo modify)
 * 
 * PROPS:
 * - mode: 'create' | 'modify'
 * - disabled: boolean
 * - loading: boolean
 * 
 * CALLBACKS:
 * - onSubmit: () => void
 * - onDelete: () => void (solo modify)
 */

import { safeInnerHTML, listen } from '../../utils/dom.js';

// Traccia listener
let cleanupListener = null;

/**
 * Renderizza footer azioni.
 * 
 * @param {HTMLElement} container - Container DOM
 * @param {Object} props - { mode, disabled, loading }
 * @param {Object} callbacks - { onSubmit, onDelete }
 */
export function renderActionFooter(container, props, callbacks) {
    if (!container) return;

    const { mode, disabled, loading } = props;
    const { onSubmit, onDelete } = callbacks;

    const isCreate = mode === 'create';
    const buttonLabel = isCreate ? 'Create Order' : 'Save Changes';

    // Submit button classes
    let submitClasses = 'flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all';
    
    if (loading) {
        submitClasses += ' bg-primary/50 cursor-wait';
    } else if (disabled) {
        submitClasses += ' bg-slate-700 text-slate-400 cursor-not-allowed';
    } else {
        submitClasses += ' bg-primary active:scale-95 shadow-lg shadow-primary/30';
    }

    let html = '';

    if (isCreate) {
        // CREATE: solo bottone Create
        html = `
            <button 
                type="button"
                class="${submitClasses}"
                data-action="submit-order"
                ${disabled || loading ? 'disabled' : ''}
                aria-label="${buttonLabel}"
            >
                ${loading ? `
                    <span class="flex items-center justify-center gap-2">
                        <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Creating...
                    </span>
                ` : buttonLabel}
            </button>
        `;
    } else {
        // MODIFY: bottoni Delete + Save
        html = `
            <button 
                type="button"
                class="px-6 py-3 rounded-xl bg-rose-500/20 text-rose-500 text-sm font-bold active:scale-95 transition-all border border-rose-500/30"
                data-action="delete-order"
                ${loading ? 'disabled' : ''}
                aria-label="Elimina ordine"
            >
                <span class="material-symbols-outlined text-xl">delete</span>
            </button>
            <button 
                type="button"
                class="${submitClasses}"
                data-action="submit-order"
                ${disabled || loading ? 'disabled' : ''}
                aria-label="${buttonLabel}"
            >
                ${loading ? `
                    <span class="flex items-center justify-center gap-2">
                        <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Saving...
                    </span>
                ` : buttonLabel}
            </button>
        `;
    }

    safeInnerHTML(container, html);

    // Cleanup listener precedente
    if (cleanupListener) {
        cleanupListener();
    }

    // Event delegation
    cleanupListener = listen(container, 'click', (e) => {
        const submitBtn = e.target.closest('[data-action="submit-order"]');
        if (submitBtn && onSubmit && !disabled && !loading) {
            onSubmit();
            return;
        }

        const deleteBtn = e.target.closest('[data-action="delete-order"]');
        if (deleteBtn && onDelete && !loading) {
            onDelete();
        }
    });

    console.log(`[ActionFooter] Rendered (mode: ${mode}, disabled: ${disabled}, loading: ${loading})`);
}

export default { renderActionFooter };
