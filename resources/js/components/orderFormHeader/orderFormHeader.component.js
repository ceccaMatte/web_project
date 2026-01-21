// Header for order form pages

import { safeInnerHTML, listen } from '../../utils/dom.js';

// Traccia listener
let cleanupListener = null;

/**
 * Renderizza header pagina Order Form.
 * 
 * @param {HTMLElement} container - Container DOM
 * @param {Object} props - { title }
 * @param {Object} callbacks - { onBack }
 */
export function renderOrderFormHeader(container, props, callbacks) {
    if (!container) return;

    const { title } = props;
    const { onBack } = callbacks;

    const html = `
        <div class="flex items-center justify-between">
            <button 
                type="button"
                class="flex items-center text-primary active:scale-95 transition-transform"
                data-action="go-back"
                aria-label="Torna alla lista ordini"
            >
                <span class="material-symbols-outlined text-3xl leading-none">chevron_left</span>
            </button>
            <h1 class="text-xl font-bold text-white">${title}</h1>
            <div class="w-10"></div>
        </div>
    `;

    safeInnerHTML(container, html);

    // Cleanup listener precedente
    if (cleanupListener) {
        cleanupListener();
    }

    // Event listener per back button
    if (onBack) {
        cleanupListener = listen(container, 'click', (e) => {
            const button = e.target.closest('[data-action="go-back"]');
            if (button) {
                onBack();
            }
        });
    }

    // rendered
}

export default { renderOrderFormHeader };
