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
        <div class="px-5 py-2 flex items-center justify-between border-b border-slate-800">
            <button 
                class="flex items-center justify-center w-8 h-8 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                data-action="go-back"
                aria-label="Go back to home"
            >
                <span class="material-symbols-outlined text-xl" aria-hidden="true">arrow_back_ios</span>
            </button>
            <h1 class="text-sm font-bold tracking-tight text-slate-500">${title}</h1>
            <div class="w-8"></div>
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
