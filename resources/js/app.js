import './bootstrap';

console.log('[App] Script loaded - checking if JS is working');

/**
 * PAGE INITIALIZATION SYSTEM
 * 
 * Pattern per inizializzare JS specifico per pagina.
 * Ogni pagina deve avere data-page="nome-pagina" sul container principale.
 * 
 * FLOW:
 * 1. DOM ready
 * 2. Cerca [data-page]
 * 3. Import dinamico del modulo corrispondente
 * 4. Chiama funzione init specifica
 * 
 * ESEMPIO:
 * - Blade: <div data-page="home">
 * - JS: import { initHomePage } from './pages/home.js'
 */

/**
 * Registry delle pagine.
 * Mappa data-page → funzione init.
 */
const pageRegistry = {
    home: async () => {
        const { initHomePage } = await import('./pages/home/home.js');
        return initHomePage;
    },
    'order-form': async () => {
        const { initOrderFormPage } = await import('./pages/order-form.js');
        return initOrderFormPage;
    },
    // TODO: Aggiungere altre pagine qui
    // orders: async () => { ... },
    // admin: async () => { ... },
};

/**
 * Inizializza pagina corrente.
 */
async function initCurrentPage() {
    // Trova elemento con data-page
    const pageElement = document.querySelector('[data-page]');
    
    if (!pageElement) {
        console.log('[App] No data-page found, skipping page initialization');
        return;
    }

    const pageName = pageElement.dataset.page;
    console.log(`[App] Detected page: ${pageName}`);

    // Cerca inizializzatore nel registry
    const pageLoader = pageRegistry[pageName];
    
    if (!pageLoader) {
        console.warn(`[App] No initializer found for page: ${pageName}`);
        return;
    }

    try {
        // Import dinamico del modulo pagina
        const initFn = await pageLoader();
        
        // Esegui inizializzazione
        initFn();
        
        console.log(`[App] Page "${pageName}" initialized successfully`);
    } catch (error) {
        console.error(`[App] Failed to initialize page "${pageName}":`, error);
    }
}

/**
 * Entry point applicazione.
 * Eseguito quando DOM è pronto.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM ready');
    initCurrentPage();
});
