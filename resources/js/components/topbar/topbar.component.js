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

// Traccia listener per evitare duplicati
let cleanupListener = null;

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

    // HTML component (header semantico, sticky, blur)
    const html = `
        <header class="flex items-center bg-background-dark/80 backdrop-blur-md px-5 py-4 justify-between sticky top-0 z-30 border-b border-border-dark/50">
            <!-- Logo + Brand -->
            <div class="flex items-center gap-3">
                <!-- Logo Icon -->
                <div class="flex size-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <span class="material-symbols-outlined text-2xl">
                        ${icons.local_shipping}
                    </span>
                </div>
                <!-- Title + Subtitle -->
                <div>
                    <h1 class="text-white text-base font-bold leading-tight">
                        ${labels.topbar.appName || 'Campus Truck'}
                    </h1>
                    <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                        ${labels.topbar.tagline || 'Student Service'}
                    </p>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
                <button
                    type="button"
                    class="flex items-center justify-center rounded-full h-10 w-10 bg-surface-dark border border-border-dark text-slate-300 hover:text-white active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-action="${action}"
                    aria-label="${ariaLabel}"
                    aria-expanded="${sidebarOpen}"
                    aria-controls="sidebar-menu"
                >
                    <span class="material-symbols-outlined text-[22px]">
                        ${icon}
                    </span>
                </button>
            </div>
        </header>
    `;

    // Mount HTML
    safeInnerHTML(container, html);

    console.log('[TopBar] HTML mounted, registering event listeners...');
    console.log('[TopBar] onToggleSidebar callback:', typeof onToggleSidebar);

    // Rimuovi listener precedente per evitare duplicati
    if (cleanupListener) {
        console.log('[TopBar] Removing previous listener');
        cleanupListener();
    }

    // Event delegation: click sul bottone hamburger
    const button = container.querySelector('[data-action]');
    console.log('[TopBar] Button found:', button);
    
    if (button && onToggleSidebar) {
        cleanupListener = listen(button, 'click', () => {
            console.log('[TopBar] Button clicked! Current sidebarOpen:', sidebarOpen);
            const newState = !sidebarOpen;
            console.log('[TopBar] Calling onToggleSidebar with:', newState);
            onToggleSidebar(newState);
        });
        console.log('[TopBar] Event listener registered');
    } else {
        console.warn('[TopBar] Cannot register listener - button:', button, 'callback:', onToggleSidebar);
    }

    console.log('[TopBar] Rendered');
}

/**
 * Export default
 */
export default {
    renderTopBar,
};
