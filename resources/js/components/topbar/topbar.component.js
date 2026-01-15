/**
 * TOPBAR COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza barra superiore con logo/titolo
 * - Mostra nome utente se autenticato
 * - Bottone hamburger/X per sidebar (cambia in base a sidebarOpen)
 * 
 * ARCHITETTURA:
 * - Componente stateless (riceve props + callbacks)
 * - Event delegation locale (click sul bottone)
 * - Accessibilità: aria-expanded, aria-label dinamici
 * 
 * PROPS:
 * - user: { authenticated, name }
 * - sidebarOpen: boolean
 * 
 * CALLBACKS:
 * - onToggleSidebar(isOpen: boolean)
 * 
 * UTILIZZO:
 * import { renderTopBar } from '@/components/topbar/topbar.component.js';
 * renderTopBar(containerEl, props, callbacks);
 */

import { icons, labels, a11y } from '../../config/ui.config.js';
import { safeInnerHTML, listen } from '../../utils/dom.js';
import { setAriaAttributes } from '../../utils/a11y.js';

/**
 * Render TopBar component
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} props - { user: {authenticated, name}, sidebarOpen: boolean }
 * @param {Object} callbacks - { onToggleSidebar: (isOpen) => void }
 */
export function renderTopBar(container, props, callbacks) {
    if (!container) {
        console.warn('[TopBar] Container is null');
        return;
    }

    const { user, sidebarOpen } = props;
    const { onToggleSidebar } = callbacks;

    // Determina icona e label in base a stato sidebar
    const icon = sidebarOpen ? icons.close : icons.menu;
    const ariaLabel = sidebarOpen ? a11y.topbar.closeSidebar : a11y.topbar.openSidebar;
    const action = sidebarOpen ? 'close-sidebar' : 'open-sidebar';

    // Greeting se autenticato
    const greeting = user.authenticated && user.name 
        ? labels.topbar.greeting(user.name) 
        : '';

    // HTML component
    const html = `
        <div class="flex items-center justify-between h-16 px-4">
            <!-- Logo / Title -->
            <div class="flex items-center gap-3">
                <h1 class="text-xl font-bold text-white">
                    Panini App
                </h1>
                ${greeting ? `
                    <span class="text-sm text-slate-400" data-user-name>
                        ${greeting}
                    </span>
                ` : ''}
            </div>

            <!-- Hamburger / Close Button -->
            <button
                type="button"
                class="p-2 rounded-lg hover:bg-slate-800 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                data-action="${action}"
                aria-label="${ariaLabel}"
                aria-expanded="${sidebarOpen}"
                aria-controls="sidebar-menu"
            >
                <span class="material-symbols-outlined text-slate-300">
                    ${icon}
                </span>
            </button>
        </div>
    `;

    // Mount HTML
    safeInnerHTML(container, html);

    // Event delegation: click sul bottone hamburger
    const button = container.querySelector('[data-action]');
    if (button && onToggleSidebar) {
        listen(button, 'click', () => {
            const newState = !sidebarOpen;
            onToggleSidebar(newState);
        });
    }

    console.log('[TopBar] Rendered');
}

/**
 * Export default
 */
export default {
    renderTopBar,
};
