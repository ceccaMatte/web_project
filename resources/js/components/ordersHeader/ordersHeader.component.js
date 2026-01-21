/**
 * ORDERS HEADER COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Header minimal per pagina Orders
 * - Back button + titolo centrato
 * 
 * REFERENCE DESIGN:
 * <div class="px-5 py-2 flex items-center justify-between border-t ...">
 *   <button> back </button>
 *   <h1>Your Orders</h1>
 *   <div class="w-6"></div>
 * </div>
 * 
 * PROPS:
 * - title: string
 * 
 * CALLBACKS:
 * - onBack: () => void
 */

import { safeInnerHTML } from '../../utils/dom.js';

let cleanupListener = null;

/**
 * Render ordersHeader component
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} props - { title }
 * @param {Object} callbacks - { onBack }
 */
export function renderOrdersHeader(container, props, callbacks) {
    if (!container) return;

    const { title } = props;
    const { onBack } = callbacks;

    const html = `
        <div class="flex items-center justify-between px-5 py-2 border-b border-slate-800">
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

    // Cleanup previous listener
    if (cleanupListener) {
        cleanupListener();
        cleanupListener = null;
    }

    // Event delegation
    const handleClick = (e) => {
        const target = e.target.closest('[data-action="go-back"]');
        if (target && onBack) {
            onBack();
        }
    };

    container.addEventListener('click', handleClick);
    cleanupListener = () => container.removeEventListener('click', handleClick);
}

export default { renderOrdersHeader };
