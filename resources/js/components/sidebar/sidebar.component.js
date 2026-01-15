/**
 * SIDEBAR COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza sidebar con overlay
 * - Gestisce chiusura (X, overlay click, ESC)
 * - Focus trap quando aperta
 * 
 * ARCHITETTURA:
 * - Stateless component (props + callbacks)
 * - Accessibilità: focus trap, ESC, aria-*
 * - Event delegation locale
 * 
 * PROPS:
 * - open: boolean
 * - user: { authenticated, name }
 * 
 * CALLBACKS:
 * - onClose: () => void
 */

import { icons, labels, a11y } from '../../config/ui.config.js';
import { addClass, removeClass, listen } from '../../utils/dom.js';
import { createFocusTrap, handleEscapeKey } from '../../utils/a11y.js';

// Store cleanup functions per gestione focus trap
let focusTrap = null;
let escapeCleanup = null;
let overlayCleanup = null;

/**
 * Render Sidebar component
 * 
 * @param {HTMLElement} container - Sidebar container
 * @param {HTMLElement} overlay - Overlay element
 * @param {Object} props - { open, user }
 * @param {Object} callbacks - { onClose }
 */
export function renderSidebar(container, overlay, props, callbacks) {
    if (!container) {
        console.warn('[Sidebar] Container is null');
        return;
    }

    const { open, user } = props;
    const { onClose } = callbacks;

    // Toggle classi apertura/chiusura
    if (open) {
        removeClass(container, 'translate-x-full');
        if (overlay) removeClass(overlay, 'hidden');

        // Focus trap quando aperta
        if (!focusTrap) {
            focusTrap = createFocusTrap(container);
        }
        focusTrap.activate();

        // ESC per chiudere
        if (!escapeCleanup && onClose) {
            escapeCleanup = handleEscapeKey(onClose);
        }

        // Overlay click per chiudere (rimuovi listener precedente)
        if (overlayCleanup) {
            overlayCleanup();
        }
        if (overlay && onClose) {
            overlayCleanup = listen(overlay, 'click', onClose);
        }
    } else {
        addClass(container, 'translate-x-full');
        if (overlay) addClass(overlay, 'hidden');

        // Cleanup focus trap e ESC
        if (focusTrap) {
            focusTrap.deactivate();
        }
        if (escapeCleanup) {
            escapeCleanup();
            escapeCleanup = null;
        }
        if (overlayCleanup) {
            overlayCleanup();
            overlayCleanup = null;
        }
    }

    console.log(`[Sidebar] Rendered (${open ? 'open' : 'closed'})`);
}

/**
 * Export default
 */
export default {
    renderSidebar,
};
