/**
 * EMPTY STATE CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Stato vuoto riusabile per active orders e altri contesti
 * - Icona + messaggio + CTA opzionale
 * 
 * PROPS:
 * - icon: string (material symbol name)
 * - message: string
 * - ctaLabel: string|null (se null, no CTA)
 * - ctaIcon: string|null (icona nel CTA)
 * 
 * CALLBACKS:
 * - onCtaClick: () => void (opzionale)
 */

import { safeInnerHTML } from '../../utils/dom.js';

let cleanupListener = null;

/**
 * Render emptyStateCard component
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} props - { icon, message, ctaLabel, ctaIcon }
 * @param {Object} callbacks - { onCtaClick }
 */
export function renderEmptyStateCard(container, props, callbacks = {}) {
    if (!container) return;

    const { icon, message, ctaLabel, ctaIcon } = props;
    const { onCtaClick } = callbacks;

    const ctaHTML = ctaLabel ? `
        <button 
            class="w-full max-w-xs bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            data-action="cta-click"
            aria-label="${ctaLabel}"
        >
            ${ctaIcon ? `<span class="material-symbols-outlined text-sm" aria-hidden="true">${ctaIcon}</span>` : ''}
            ${ctaLabel}
        </button>
    ` : '';

    const html = `
        <div class="h-[180px] w-full bg-slate-100 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center">
            <div class="mb-4">
                <span class="material-symbols-outlined text-slate-400 dark:text-slate-600 text-4xl" aria-hidden="true">${icon}</span>
            </div>
            <p class="text-slate-600 dark:text-slate-400 text-sm font-medium mb-4">${message}</p>
            ${ctaHTML}
        </div>
    `;

    safeInnerHTML(container, html);

    // Cleanup previous listener
    if (cleanupListener) {
        cleanupListener();
        cleanupListener = null;
    }

    // Event delegation for CTA
    if (ctaLabel && onCtaClick) {
        const handleClick = (e) => {
            const target = e.target.closest('[data-action="cta-click"]');
            if (target) {
                onCtaClick();
            }
        };

        container.addEventListener('click', handleClick);
        cleanupListener = () => container.removeEventListener('click', handleClick);
    }
}

export default { renderEmptyStateCard };
