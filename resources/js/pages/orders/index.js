// Orders page entry: initialize view refs, hydrate state and wire events

import { ordersView } from './orders.view.js';
import { ordersState, mutateLoading } from './orders.state.js';
import { hydrateUserFromDOM, hydrateSchedulerFromDOM, refreshOrdersState } from './orders.hydration.js';
import { goBack, navigateToCreate, navigateToModify, logout } from './orders.actions.js';

// Polling interval ID (globale per cleanup)
let pollingIntervalId = null;

export async function initOrdersPage() {
    ordersView.init();

    await hydrateInlineData();

    mutateLoading(true);
    const { renderOrdersPage } = await import('./orders.render.js');
    renderOrdersPage();

    // use ordersState.selectedDayId as source of truth
    const selectedDay = ordersState.selectedDayId;
    await refreshOrdersState(selectedDay);

    startPolling();
    registerGlobalEventDelegation();
    window.addEventListener('beforeunload', stopPolling);
}

// Polling: refresh orders for currently selected day
function startPolling() {
    // Evita duplicati
    if (pollingIntervalId) return;

    pollingIntervalId = setInterval(async () => {
        const selectedDay = ordersState.selectedDayId;
        try {
            await refreshOrdersState(selectedDay);
        } catch (error) {
            console.error('Polling fetch failed', error);
        }
    }, 5000);
}

function stopPolling() {
    if (pollingIntervalId) {
        
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
    }
}
async function hydrateInlineData() {

    // User state
    const userScript = document.querySelector('script[data-user-state]');
    if (userScript) {
        try {
            const userData = JSON.parse(userScript.textContent);
            hydrateUserFromDOM(userData);
        } catch (e) {
            console.warn('Failed to parse user data:', e);
        }
    }

    // Scheduler state
    const schedulerScript = document.querySelector('script[data-week-days]');
    if (schedulerScript) {
        try {
            const schedulerData = JSON.parse(schedulerScript.textContent);
            hydrateSchedulerFromDOM(schedulerData);
        } catch (e) {
            console.warn('Failed to parse scheduler data:', e);
        }
    }

    // Render iniziale con i dati inline (loading = false, activeOrders/recentOrders = empty)
    // Questo mostra l'UI subito senza aspettare il fetch API
    const { renderOrdersPage } = await import('./orders.render.js');
    renderOrdersPage();
}

function registerGlobalEventDelegation() {

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

            case 'logout':
                event.preventDefault();
                logout();
                break;

            default:
                // Azioni già gestite nei componenti (sidebar, topbar, cards)
                break;
        }
    });

}

/**
 * Export default per import aggregato
 */
export default {
    initOrdersPage,
};
