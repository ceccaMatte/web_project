// Entry point for admin work service page

import { workServiceView } from './adminWorkService.view.js';
import { logoutUser } from '../home/home.api.js';
import { workServiceState, mutateLoading } from './adminWorkService.state.js';
import { hydrateUserFromDOM, hydrateSchedulerFromDOM, refreshWorkServiceState, pollRefresh } from './adminWorkService.hydration.js';
import { closeRecapModal, changeStatus } from './adminWorkService.actions.js';
import { renderWorkServicePage, renderCurrentTime, renderRecapCard } from './adminWorkService.render.js';
import { buildWorkOrderRecapCardHTML } from '../../components/workOrderRecapCard/workOrderRecapCard.component.js';

// Polling interval ID (globale per cleanup)
let pollingIntervalId = null;

// Clock interval ID
let clockIntervalId = null;

// Polling interval in ms
const POLLING_INTERVAL = 5000;

/**
 * Inizializza pagina Admin Work Service
 * 
 * WORKFLOW:
 * 1. Inizializza DOM refs
 * 2. Hydrate dati inline (user)
 * 3. Genera scheduler per settimana corrente
 * 4. Mostra loader iniziale
 * 5. Fetch stato da API per oggi
 * 6. Render completo UI
 * 7. Avvia polling ogni 5 secondi
 * 8. Avvia clock update ogni minuto
 * 9. Registra event delegation globale
 * 
 * Chiamato da app.js quando data-page="admin-work-service".
 */
export async function initAdminWorkServicePage() {
    workServiceView.init();
    hydrateUserFromDOM();
    hydrateSchedulerFromDOM();

    mutateLoading(true);
    renderWorkServicePage();

    const selectedDay = workServiceState.selectedDayId;
    await refreshWorkServiceState(selectedDay);

    startPolling();
    startClockUpdate();
    registerGlobalEventDelegation();
    window.addEventListener('beforeunload', cleanup);
}

/**
 * Avvia polling automatico ogni 5 secondi
 * 
 * Richiama il fetch degli ordini PER IL GIORNO SELEZIONATO.
 * Il polling viene avviato DOPO il primo caricamento completo.
 * 
 * IMPORTANTE: Non resetta selezioni utente (selectedTimeSlotId, selectedOrderId).
 */
function startPolling() {
    if (pollingIntervalId) return;

    pollingIntervalId = setInterval(async () => {
        const selectedDay = workServiceState.selectedDayId;
        if (selectedDay) {
            await pollRefresh(selectedDay);
        }
    }, POLLING_INTERVAL);

    // polling started
}

/**
 * Ferma il polling
 */
function stopPolling() {
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
    }
}

/**
 * Avvia aggiornamento orologio
 */
function startClockUpdate() {
    // Update immediately
    renderCurrentTime();

    // Then every minute
    clockIntervalId = setInterval(() => {
        renderCurrentTime();
    }, 60000);

    // clock update started
}

/**
 * Ferma aggiornamento orologio
 */
function stopClockUpdate() {
    if (clockIntervalId) {
        clearInterval(clockIntervalId);
        clockIntervalId = null;
    }
}

/**
 * Cleanup risorse
 */
function cleanup() {
    stopPolling();
    stopClockUpdate();
}

// Global event delegation
function registerGlobalEventDelegation() {
    document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;

        if (action === 'change-status') {
            event.preventDefault();
            event.stopPropagation();
            const orderId = parseInt(target.dataset.orderId, 10);
            const newStatus = target.dataset.newStatus;
            if (orderId && newStatus) return changeStatus(orderId, newStatus);
            console.error('Missing orderId or newStatus for change-status');
            return;
        }

        if (action === 'toggle-status-dropdown') {
            event.preventDefault();
            event.stopPropagation();
            workServiceState.isStatusDropdownOpen = !workServiceState.isStatusDropdownOpen;
            renderRecapCard();
            return;
        }

        if (action === 'select-status') {
            event.preventDefault();
            event.stopPropagation();
            const orderId = parseInt(target.dataset.orderId, 10);
            const newStatus = target.dataset.status;
            workServiceState.isStatusDropdownOpen = false;
            if (orderId && newStatus) return changeStatus(orderId, newStatus);
            console.error('Missing orderId or newStatus for select-status');
            return;
        }

        if (action === 'toggle-recap-expansion') {
            event.preventDefault();
            event.stopPropagation();
            workServiceState.recapCardExpanded = !workServiceState.recapCardExpanded;
            renderRecapCard();
            return;
        }

        // ============ SIDEBAR ACTIONS ============

        // Open sidebar (hamburger)
        if (action === 'open-sidebar') {
            event.preventDefault();
            openSidebar();
            return;
        }

        // Close sidebar
        if (action === 'close-sidebar') {
            event.preventDefault();
            closeSidebar();
            return;
        }

        // Logout (client-side flow similar to Orders page)
        if (action === 'logout') {
            event.preventDefault();
            (async () => {
                try {
                    const response = await logoutUser();
                    if (response && response.success) return window.location.href = '/';
                    console.error('Logout failed', response);
                } catch (err) {
                    console.error('Logout request error', err);
                }
            })();
            return;
        }

        // Close recap modal (legacy, kept for compatibility)
        if (action === 'close-recap') {
            event.preventDefault();
            closeRecapModal();
            return;
        }
    });

    // Escape key closes sidebar or modal
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            // Close sidebar if open
            const sidebar = document.querySelector('[data-admin-sidebar]');
            if (sidebar && !sidebar.classList.contains('translate-x-full')) {
                closeSidebar();
                return;
            }
            
            // Close recap modal if open (mobile)
            if (workServiceState.selectedOrderId && window.innerWidth < 1024) {
                closeRecapModal();
            }
        }
    });

    // event delegation registered
}

/**
 * Apre la sidebar (mobile)
 */
function openSidebar() {
    const sidebar = document.querySelector('[data-admin-sidebar]');
    const backdrop = document.querySelector('[data-sidebar-backdrop]');
    
    if (sidebar && backdrop) {
        sidebar.classList.remove('translate-x-full');
        backdrop.classList.remove('hidden');
    }
}

/**
 * Chiude la sidebar (mobile)
 */
function closeSidebar() {
    const sidebar = document.querySelector('[data-admin-sidebar]');
    const backdrop = document.querySelector('[data-sidebar-backdrop]');
    
    if (sidebar && backdrop) {
        sidebar.classList.add('translate-x-full');
        backdrop.classList.add('hidden');
    }
}

// Export for app.js
export default { initAdminWorkServicePage };
