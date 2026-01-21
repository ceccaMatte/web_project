import './bootstrap';

// Page initialization

/**
 * Registry delle pagine.
 * Mappa data-page → funzione init.
 */
const pageRegistry = {
    home: async () => {
        const { initHomePage } = await import('./pages/home/home.js');
        return initHomePage;
    },
    auth: async () => {
        const { initAuthPage } = await import('./pages/auth/auth.js');
        return initAuthPage;
    },
    'order-form': async () => {
        const { initOrderFormPage } = await import('./pages/order-form.js');
        return initOrderFormPage;
    },
    orders: async () => {
        const { initOrdersPage } = await import('./pages/orders/index.js');
        return initOrdersPage;
    },
    'admin-work-service': async () => {
        const { initAdminWorkServicePage } = await import('./pages/admin-work-service/index.js');
        return initAdminWorkServicePage;
    },
    'service-planning': async () => {
        const { initServicePlanningPage } = await import('./pages/service-planning/index.js');
        return initServicePlanningPage;
    },
    // TODO: Aggiungere altre pagine qui
    // admin: async () => { ... },
};

/**
 * Inizializza pagina corrente.
 */
async function initCurrentPage() {
    // Trova elemento con data-page
    const pageElement = document.querySelector('[data-page]');
    
    if (!pageElement) return;

    const pageName = pageElement.dataset.page;

    // Cerca inizializzatore nel registry
    const pageLoader = pageRegistry[pageName];
    
    if (!pageLoader) {
        console.warn(`[App] No initializer found for page: ${pageName}`);
        return;
    }

    try {
        // Import dinamico del modulo pagina
        const initFn = await pageLoader();
        
        initFn();
    } catch (error) {
        console.error(`[App] Failed to initialize page "${pageName}":`, error);
    }
}

/**
 * Entry point applicazione.
 * Eseguito quando DOM è pronto.
 */
document.addEventListener('DOMContentLoaded', initCurrentPage);
