// Sidebar renderer (stateless)

import { icons, labels, a11y } from '../../config/ui.config.js';
import { addClass, removeClass, listen } from '../../utils/dom.js';
import { createFocusTrap, handleEscapeKey } from '../../utils/a11y.js';

// Store cleanup functions per gestione focus trap
let focusTrap = null;
let escapeCleanup = null;
let overlayCleanup = null;
let closeButtonCleanup = null;

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
        // AGGIUNTA: Render icona Orders SEMPRE
        const ordersItem = container.querySelector('[data-sidebar-item="orders"]');
        if (ordersItem && !ordersItem.querySelector('.sidebar-icon')) {
            let iconName = icons && icons.orders ? icons.orders : 'list_alt';
            const iconHtml = `<span class="material-symbols-outlined sidebar-icon mr-2" aria-hidden="true">${iconName}</span>`;
            ordersItem.insertAdjacentHTML('afterbegin', iconHtml);
        }

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

        // Close button click per chiudere (rimuovi listener precedente)
        if (closeButtonCleanup) {
            closeButtonCleanup();
        }
        const closeButton = container.querySelector('[data-action="close-sidebar"]');
        if (closeButton && onClose) {
            closeButtonCleanup = listen(closeButton, 'click', (e) => {
                e.stopPropagation();
                onClose();
            });
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
        if (closeButtonCleanup) {
            closeButtonCleanup();
            closeButtonCleanup = null;
        }
    }

    // render complete
}

/**
 * Export default
 */
export default {
    renderSidebar,
};
