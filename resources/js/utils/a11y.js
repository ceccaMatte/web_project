// Accessibility utilities

/**
 * FOCUSABLE ELEMENTS SELECTOR
 * 
 * Selettore CSS per tutti gli elementi focusabili.
 * Usato da focus trap e keyboard navigation.
 */
const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Crea un focus trap in un elemento container
 * 
 * FUNZIONAMENTO:
 * - Cattura TAB e SHIFT+TAB dentro il container
 * - Cicla il focus tra elementi focusabili
 * - Previene uscita dal container
 * 
 * USO TIPICO: sidebar, modal, dialog
 * 
 * @param {HTMLElement} container - Container dove intrappolare focus
 * @returns {Object} - { activate, deactivate }
 * 
 * @example
 * const trap = createFocusTrap(sidebarElement);
 * trap.activate();
 * // ... quando chiudi sidebar
 * trap.deactivate();
 */
export function createFocusTrap(container) {
    if (!container) {
        console.warn('[a11y] createFocusTrap: container is null');
        return { activate: () => {}, deactivate: () => {} };
    }

    let previousActiveElement = null;
    let isActive = false;

    /**
     * Ottiene tutti gli elementi focusabili dentro il container
     * @returns {Array<HTMLElement>}
     */
    function getFocusableElements() {
        return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
            .filter(el => el.offsetParent !== null); // Filtra elementi nascosti
    }

    /**
     * Handler tastiera per intercettare TAB
     * @param {KeyboardEvent} event
     */
    function handleKeyDown(event) {
        if (!isActive || event.key !== 'Tab') return;

        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        // SHIFT + TAB sul primo elemento → vai all'ultimo
        if (event.shiftKey && activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
            return;
        }

        // TAB sull'ultimo elemento → vai al primo
        if (!event.shiftKey && activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
            return;
        }
    }

    /**
     * Attiva il focus trap
     */
    function activate() {
        if (isActive) return;

        // Salva elemento attivo corrente per ripristino
        previousActiveElement = document.activeElement;

        // Focus sul primo elemento focusabile
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        document.addEventListener('keydown', handleKeyDown);
        isActive = true;
    }

    /**
     * Disattiva il focus trap e ripristina focus precedente
     */
    function deactivate() {
        if (!isActive) return;

        // Rimuovi listener
        document.removeEventListener('keydown', handleKeyDown);
        isActive = false;

        if (previousActiveElement && previousActiveElement.focus) {
            previousActiveElement.focus();
        }
    }

    return { activate, deactivate };
}

/**
 * Gestisce chiusura con ESC
 * 
 * Helper comune per sidebar, modal, dropdown.
 * 
 * @param {Function} onEscape - Callback quando ESC viene premuto
 * @returns {Function} - Cleanup function
 * 
 * @example
 * const cleanup = handleEscapeKey(() => closeSidebar());
 * // Quando non serve più:
 * cleanup();
 */
export function handleEscapeKey(onEscape) {
    if (typeof onEscape !== 'function') {
        console.warn('[a11y] handleEscapeKey: onEscape must be a function');
        return () => {};
    }

    function handleKeyDown(event) {
        if (event.key === 'Escape' || event.key === 'Esc') {
            event.preventDefault();
            onEscape();
        }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Ritorna cleanup function
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
}

/**
 * Gestisce navigazione con frecce (keyboard navigation)
 * 
 * USO: liste, menu, scheduler giorni.
 * 
 * @param {HTMLElement} container - Container degli elementi navigabili
 * @param {string} itemSelector - Selettore per singoli item
 * @param {Object} options - { loop: boolean, horizontal: boolean }
 * @returns {Function} - Cleanup function
 * 
 * @example
 * const cleanup = handleArrowNavigation(
 *   schedulerContainer,
 *   '[data-day-id]',
 *   { loop: true, horizontal: true }
 * );
 */
export function handleArrowNavigation(container, itemSelector, options = {}) {
    const { loop = true, horizontal = true } = options;

    function handleKeyDown(event) {
        const items = Array.from(container.querySelectorAll(itemSelector))
            .filter(el => el.offsetParent !== null); // Filtra nascosti
        
        if (items.length === 0) return;

        const currentIndex = items.indexOf(document.activeElement);
        if (currentIndex === -1) return;

        let nextIndex = currentIndex;

        // Frecce orizzontali (scheduler, tabs)
        if (horizontal) {
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                nextIndex = loop ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                nextIndex = loop ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
            }
        }

        // Frecce verticali (liste, menu)
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            nextIndex = loop ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            nextIndex = loop ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0);
        }

        if (nextIndex !== currentIndex) {
            items[nextIndex].focus();
        }
    }

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
}

/**
 * Annuncia messaggio allo screen reader
 * 
 * Crea un live region ARIA per notifiche dinamiche.
 * 
 * @param {string} message - Messaggio da annunciare
 * @param {string} priority - 'polite' | 'assertive'
 * 
 * @example
 * announceToScreenReader('Ordine creato con successo', 'polite');
 */
export function announceToScreenReader(message, priority = 'polite') {
    if (!message) return;

    // Cerca live region esistente o creane uno
    let liveRegion = document.getElementById('a11y-live-region');
    
    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'a11y-live-region';
        liveRegion.className = 'sr-only'; // Tailwind class per screen reader only
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
    }

    // Aggiorna contenuto (trigger annuncio)
    liveRegion.textContent = message;

    // Pulisci dopo 5 secondi
    setTimeout(() => {
        if (liveRegion.textContent === message) {
            liveRegion.textContent = '';
        }
    }, 5000);
}

/**
 * Imposta attributi ARIA in batch
 * 
 * Helper per evitare ripetizioni setAttribute.
 * 
 * @param {HTMLElement} element
 * @param {Object} attributes - { 'aria-label': 'value', ... }
 * 
 * @example
 * setAriaAttributes(button, {
 *   'aria-label': 'Chiudi menu',
 *   'aria-expanded': 'true',
 *   'aria-controls': 'sidebar-menu'
 * });
 */
export function setAriaAttributes(element, attributes) {
    if (!element || !attributes) return;

    Object.entries(attributes).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            element.removeAttribute(key);
        } else {
            element.setAttribute(key, String(value));
        }
    });
}

/**
 * Export default per import aggregato
 */
export default {
    createFocusTrap,
    handleEscapeKey,
    handleArrowNavigation,
    announceToScreenReader,
    setAriaAttributes,
    FOCUSABLE_SELECTOR,
};
