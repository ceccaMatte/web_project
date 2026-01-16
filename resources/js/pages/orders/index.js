/**
 * ORDERS PAGE - Orchestratore
 * 
 * RESPONSABILITÀ:
 * - Entry point della pagina Orders
 * - Inizializzazione view refs
 * - Trigger hydration iniziale
 * - Event delegation globale
 * 
 * ARCHITETTURA MODULARE:
 * 
 * orders.state.js        → SSOT, mutation helpers
 * orders.view.js         → DOM refs
 * orders.api.js          → fetch API
 * orders.hydration.js    → idratazione state
 * orders.actions.js      → azioni utente
 * orders.render.js       → orchestrazione render componenti
 * 
 * COMPONENTI RIUTILIZZABILI:
 * 
 * components/topbar/               → TopBar (logo + hamburger)
 * components/sidebar/              → Sidebar + overlay
 * components/weekScheduler/        → Scheduler settimanale
 * 
 * PATTERN:
 * - SSOT: ordersState centralizza tutti i dati
 * - Stateless components: ricevono props + callbacks
 * - Unidirectional data flow: action → state → render
 * - Event delegation locale nei componenti
 * - Accessibilità WCAG AAA
 */

import { ordersView } from './orders.view.js';
import { ordersState } from './orders.state.js';
import { hydrateUserFromDOM, hydrateSchedulerFromDOM, refreshOrdersState } from './orders.hydration.js';
import { goBack, navigateToCreate, navigateToModify } from './orders.actions.js';

/**
 * Inizializza pagina Orders
 * 
 * WORKFLOW:
 * 1. Inizializza DOM refs
 * 2. Hydrate dati inline (user, scheduler) per render veloce
 * 3. Fetch stato completo da API
 * 4. Render completo UI
 * 5. Registra event delegation globale
 * 
 * Chiamato da app.js quando data-page="orders".
 */
export async function initOrdersPage() {
    console.log('[Orders] Initializing orders page...');

    // 1. Inizializza riferimenti DOM
    ordersView.init();

    // 2. Hydrate dati inline dal DOM (per render veloce senza flicker)
    hydrateInlineData();

    // 3. Fetch stato iniziale da API e render
    await refreshOrdersState();

    // 4. Registra event delegation globale
    registerGlobalEventDelegation();

    console.log('[Orders] Orders page initialized successfully');
}

/**
 * Hydrate dati passati inline nel DOM via <script type="application/json">
 * 
 * Questo permette un render iniziale veloce senza aspettare il fetch API.
 * Dopo l'hydration inline, triggera un render iniziale della UI.
 */
async function hydrateInlineData() {
    console.log('[Orders] Hydrating inline data from DOM...');

    // User state
    const userScript = document.querySelector('script[data-user-state]');
    if (userScript) {
        try {
            const userData = JSON.parse(userScript.textContent);
            hydrateUserFromDOM(userData);
        } catch (e) {
            console.warn('[Orders] Failed to parse user data:', e);
        }
    }

    // Scheduler state
    const schedulerScript = document.querySelector('script[data-week-days]');
    if (schedulerScript) {
        try {
            const schedulerData = JSON.parse(schedulerScript.textContent);
            hydrateSchedulerFromDOM(schedulerData);
        } catch (e) {
            console.warn('[Orders] Failed to parse scheduler data:', e);
        }
    }

    console.log('[Orders] Inline data hydrated');

    // Render iniziale con i dati inline (loading = false, activeOrders/recentOrders = empty)
    // Questo mostra l'UI subito senza aspettare il fetch API
    const { renderOrdersPage } = await import('./orders.render.js');
    renderOrdersPage();
    console.log('[Orders] Initial render after inline hydration completed');
}

/**
 * Registra event delegation globale per azioni
 * 
 * Pattern: data-action="nome-azione"
 * 
 * NOTA: Gestisce SOLO le azioni che NON sono già gestite dai componenti.
 * I componenti gestiscono internamente le proprie azioni tramite callbacks.
 * Qui gestiamo solo azioni globali come navigazione.
 */
function registerGlobalEventDelegation() {
    console.log('[Orders] Registering global event delegation...');

    document.addEventListener('click', (event) => {
        const actionTarget = event.target.closest('[data-action]');
        if (!actionTarget) return;

        const action = actionTarget.dataset.action;

        // NOTA: toggle-expand, toggle-favorite, toggle-favorites-filter, reorder
        // sono gestiti internamente dai componenti via callbacks.
        // Non duplicare qui per evitare doppia esecuzione.

        switch (action) {
            case 'go-back':
                event.preventDefault();
                goBack();
                break;

            case 'order-now':
                event.preventDefault();
                navigateToCreate();
                break;

            case 'modify-order':
                event.preventDefault();
                const modifyOrderId = parseInt(actionTarget.dataset.orderId, 10);
                if (modifyOrderId) navigateToModify(modifyOrderId);
                break;

            default:
                // Azioni già gestite nei componenti (sidebar, topbar, cards)
                break;
        }
    });

    console.log('[Orders] Global event delegation registered');
}

/**
 * Export default per import aggregato
 */
export default {
    initOrdersPage,
};
