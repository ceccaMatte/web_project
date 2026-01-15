/**
 * DOM UTILITIES
 * 
 * RESPONSABILITÀ:
 * - Helper per query selectors type-safe
 * - Manipolazione DOM sicura e testabile
 * - Evita ripetizioni di codice DOM
 * 
 * ARCHITETTURA:
 * - Funzioni pure e riusabili
 * - Gestione errori graceful
 * - Type-safe dove possibile
 */

/**
 * Query selector singolo con validazione
 * 
 * @param {string} selector - Selettore CSS
 * @param {HTMLElement} context - Contesto di ricerca (default: document)
 * @returns {HTMLElement|null}
 */
export function qs(selector, context = document) {
    if (!selector) {
        console.warn('[DOM] qs: selector is empty');
        return null;
    }
    
    try {
        return context.querySelector(selector);
    } catch (error) {
        console.error(`[DOM] qs: invalid selector "${selector}"`, error);
        return null;
    }
}

/**
 * Query selector multiplo con validazione
 * 
 * @param {string} selector - Selettore CSS
 * @param {HTMLElement} context - Contesto di ricerca (default: document)
 * @returns {NodeList}
 */
export function qsa(selector, context = document) {
    if (!selector) {
        console.warn('[DOM] qsa: selector is empty');
        return [];
    }
    
    try {
        return context.querySelectorAll(selector);
    } catch (error) {
        console.error(`[DOM] qsa: invalid selector "${selector}"`, error);
        return [];
    }
}

/**
 * Imposta innerHTML in modo sicuro
 * 
 * NOTA: Non sanitizza HTML. Se i dati provengono da utenti,
 * usa una libreria di sanitizzazione (es. DOMPurify).
 * 
 * @param {HTMLElement} element - Elemento target
 * @param {string} html - HTML da inserire
 * @returns {boolean} - Success
 */
export function safeInnerHTML(element, html) {
    if (!element) {
        console.warn('[DOM] safeInnerHTML: element is null');
        return false;
    }
    
    try {
        element.innerHTML = html;
        return true;
    } catch (error) {
        console.error('[DOM] safeInnerHTML: failed', error);
        return false;
    }
}

/**
 * Controlla se un elemento è visibile nel viewport
 * 
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Trova il parent più vicino che matcha un selettore
 * Wrapper moderno per event delegation
 * 
 * @param {HTMLElement} element - Elemento di partenza
 * @param {string} selector - Selettore da matchare
 * @returns {HTMLElement|null}
 */
export function closest(element, selector) {
    if (!element || !selector) return null;
    
    try {
        return element.closest(selector);
    } catch (error) {
        console.error(`[DOM] closest: invalid selector "${selector}"`, error);
        return null;
    }
}

/**
 * Aggiunge event listener con cleanup automatico
 * Utile per gestire eventi in componenti riutilizzabili
 * 
 * @param {HTMLElement} element
 * @param {string} event
 * @param {Function} handler
 * @param {Object} options
 * @returns {Function} - Cleanup function
 */
export function listen(element, event, handler, options = {}) {
    if (!element || !event || !handler) {
        console.warn('[DOM] listen: missing required params');
        return () => {};
    }
    
    element.addEventListener(event, handler, options);
    
    // Ritorna cleanup function
    return () => {
        element.removeEventListener(event, handler, options);
    };
}

/**
 * Controlla se un elemento ha una classe
 * 
 * @param {HTMLElement} element
 * @param {string} className
 * @returns {boolean}
 */
export function hasClass(element, className) {
    return element?.classList?.contains(className) ?? false;
}

/**
 * Toggle classe con controllo esistenza elemento
 * 
 * @param {HTMLElement} element
 * @param {string} className
 * @param {boolean} force - Opzionale: forza add/remove
 * @returns {boolean} - Success
 */
export function toggleClass(element, className, force) {
    if (!element?.classList) return false;
    
    if (force !== undefined) {
        element.classList.toggle(className, force);
    } else {
        element.classList.toggle(className);
    }
    
    return true;
}

/**
 * Aggiunge multiple classi
 * 
 * @param {HTMLElement} element
 * @param {...string} classNames
 * @returns {boolean} - Success
 */
export function addClass(element, ...classNames) {
    if (!element?.classList) return false;
    element.classList.add(...classNames);
    return true;
}

/**
 * Rimuove multiple classi
 * 
 * @param {HTMLElement} element
 * @param {...string} classNames
 * @returns {boolean} - Success
 */
export function removeClass(element, ...classNames) {
    if (!element?.classList) return false;
    element.classList.remove(...classNames);
    return true;
}

/**
 * Export default per import aggregato
 */
export default {
    qs,
    qsa,
    safeInnerHTML,
    isElementVisible,
    closest,
    listen,
    hasClass,
    toggleClass,
    addClass,
    removeClass,
};
