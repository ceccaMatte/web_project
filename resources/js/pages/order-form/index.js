// Entry point for Order Form page

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
    pollingIntervalId = setInterval(async () => {
        // In create, passa data per time slots
        const date = orderFormState.mode === 'create' ? orderFormState.selectedDayId : null;
        try {
            await refreshAvailability(date);
            renderOrderFormPage();
        } catch (error) {
            console.error('[OrderForm] Polling error:', error);
        }
    }, POLLING_INTERVAL);
}

/**
 * Ferma polling.
 */
function stopPolling() {
    if (pollingIntervalId) {
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

        // 4. Hydrate based on mode
        if (orderFormState.mode === 'modify' && orderFormState.order.id) {
            await hydrateModifyMode(orderFormState.order.id);
        } else {
            const date = orderFormState.selectedDayId || new Date().toISOString().split('T')[0];
            await hydrateCreateMode(date);
        }

        // 5. Render completo
        mutateUI({ isLoading: false });
        renderOrderFormPage();

        // 6. Avvia polling
        startPolling();

        setupEventDelegation();

    } catch (error) {
        console.error('[OrderForm] Initialization failed:', error);
        mutateUI({ isLoading: false });
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
    document.addEventListener('click', (e) => {
        // Logout (dalla sidebar)
        const logoutBtn = e.target.closest('[data-action="logout"]');
        if (logoutBtn) {
            e.preventDefault();
            logout();
            return;
        }

        const submitBtn = e.target.closest('[data-action="submit-order"]');
        if (submitBtn) return;
    });

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
