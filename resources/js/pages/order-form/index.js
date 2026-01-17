/**
 * ORDER FORM PAGE - Entry Point
 * 
 * RESPONSABILITÀ:
 * - Inizializza la pagina Order Form (Create / Modify)
 * - Orchestra hydration, render, polling
 * - Gestisce event delegation globale
 * 
 * ARCHITETTURA:
 * - Segue stesso pattern di Home e Orders
 * - State centralizzato in orderForm.state.js
 * - View refs in orderForm.view.js
 * - API calls in orderForm.api.js
 * - Actions in orderForm.actions.js
 * - Hydration in orderForm.hydration.js
 * - Render in orderForm.render.js
 * 
 * FLUSSI:
 * - CREATE: inline data → fetch availability → render
 * - MODIFY: inline data → fetch order data → render
 * - Polling ogni 5 secondi per availability
 */

import { orderFormState, mutateUI } from './orderForm.state.js';
import { orderFormView } from './orderForm.view.js';
import { hydrateFromInlineData, hydrateCreateMode, hydrateModifyMode, refreshAvailability } from './orderForm.hydration.js';
import { renderOrderFormPage } from './orderForm.render.js';
import { logout } from './orderForm.actions.js';

// =============================================================================
// POLLING
// =============================================================================

let pollingIntervalId = null;
const POLLING_INTERVAL = 5000; // 5 secondi

/**
 * Avvia polling availability.
 */
function startPolling() {
    if (pollingIntervalId) return;

    console.log('[OrderForm] Starting polling every 5 seconds...');

    pollingIntervalId = setInterval(async () => {
        // In create, passa data per time slots
        const date = orderFormState.mode === 'create' ? orderFormState.selectedDayId : null;
        
        console.log(`[OrderForm] Polling: refreshing availability (date: ${date || 'none'})`);
        
        try {
            await refreshAvailability(date);
            renderOrderFormPage();
            console.log('[OrderForm] Polling: availability updated');
        } catch (error) {
            console.error('[OrderForm] Polling error:', error);
        }
    }, POLLING_INTERVAL);

    console.log('[OrderForm] Polling started with interval ID:', pollingIntervalId);
}

/**
 * Ferma polling.
 */
function stopPolling() {
    if (pollingIntervalId) {
        console.log('[OrderForm] Stopping polling...');
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
    }
}

// Cleanup polling on page unload
window.addEventListener('beforeunload', stopPolling);

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Inizializza pagina Order Form.
 */
async function initOrderFormPage() {
    console.log('[OrderForm] Initializing order form page...');

    try {
        // 1. Init DOM refs
        orderFormView.init();

        // 2. Hydrate da inline data
        const inlineData = hydrateFromInlineData();
        if (!inlineData) {
            console.error('[OrderForm] Failed to read inline data');
            return;
        }

        // 3. Render iniziale (mostra loader)
        mutateUI({ isLoading: true });
        renderOrderFormPage();

        // 4. Hydrate in base a mode
        if (orderFormState.mode === 'modify' && orderFormState.order.id) {
            // MODIFY MODE
            console.log('[OrderForm] Hydrating MODIFY mode...');
            await hydrateModifyMode(orderFormState.order.id);
        } else {
            // CREATE MODE
            console.log('[OrderForm] Hydrating CREATE mode...');
            const date = orderFormState.selectedDayId || new Date().toISOString().split('T')[0];
            await hydrateCreateMode(date);
        }

        // 5. Render completo
        mutateUI({ isLoading: false });
        renderOrderFormPage();

        // 6. Avvia polling
        startPolling();

        // 7. Setup event delegation
        setupEventDelegation();

        console.log('[OrderForm] Page initialized successfully');

    } catch (error) {
        console.error('[OrderForm] Initialization failed:', error);
        mutateUI({ isLoading: false });
        // TODO: mostrare errore all'utente
    }
}

// =============================================================================
// EVENT DELEGATION
// =============================================================================

/**
 * Setup event delegation globale.
 * 
 * Gestisce eventi che non sono legati a componenti specifici.
 */
function setupEventDelegation() {
    console.log('[OrderForm] Setting up event delegation...');

    document.addEventListener('click', (e) => {
        // Logout (dalla sidebar)
        const logoutBtn = e.target.closest('[data-action="logout"]');
        if (logoutBtn) {
            e.preventDefault();
            logout();
            return;
        }
    });

    console.log('[OrderForm] Event delegation setup complete');
}

// =============================================================================
// EXPORT & AUTO-INIT
// =============================================================================

// Auto-init quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrderFormPage);
} else {
    initOrderFormPage();
}

export { initOrderFormPage, startPolling, stopPolling };
export default { initOrderFormPage };
