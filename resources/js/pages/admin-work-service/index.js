/**
 * ADMIN WORK SERVICE PAGE - Orchestratore
 * 
 * RESPONSABILITÀ:
 * - Entry point della pagina Admin Work Service
 * - Inizializzazione view refs
 * - Trigger hydration iniziale
 * - Polling management
 * - Event delegation globale
 * 
 * ARCHITETTURA MODULARE:
 * 
 * adminWorkService.state.js      → SSOT, mutation helpers
 * adminWorkService.view.js       → DOM refs
 * adminWorkService.api.js        → fetch API
 * adminWorkService.hydration.js  → idratazione state
 * adminWorkService.actions.js    → azioni utente
 * adminWorkService.render.js     → orchestrazione render componenti
 * 
 * COMPONENTI RIUTILIZZABILI:
 * 
 * components/weekScheduler/           → Scheduler settimanale
 * components/workTimeSlotSelector/    → Selettore time slots
 * components/workStatusRow/           → Riga status pipeline
 * components/workOrderCard/           → Card singolo ordine
 * components/workOrderRecapCard/      → Recap dettagli ordine
 */

import { workServiceView } from './adminWorkService.view.js';
import { workServiceState, mutateLoading } from './adminWorkService.state.js';
import { hydrateUserFromDOM, hydrateSchedulerFromDOM, refreshWorkServiceState, pollRefresh } from './adminWorkService.hydration.js';
import { closeRecapModal } from './adminWorkService.actions.js';
import { renderWorkServicePage, renderCurrentTime } from './adminWorkService.render.js';

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
    console.log('[AdminWorkService] Initializing page...');

    // 1. Inizializza riferimenti DOM
    workServiceView.init();

    // 2. Hydrate user da DOM
    hydrateUserFromDOM();

    // 3. Genera scheduler per settimana corrente
    hydrateSchedulerFromDOM();

    // 4. Mostra loader iniziale
    mutateLoading(true);
    renderWorkServicePage();
    console.log('[AdminWorkService] Initial render with loader shown');

    // 5. Fetch stato iniziale da API per oggi
    const selectedDay = workServiceState.selectedDayId;
    console.log(`[AdminWorkService] Fetching initial data for: ${selectedDay}`);
    await refreshWorkServiceState(selectedDay);

    // 6. Avvia polling ogni 5 secondi
    startPolling();

    // 7. Avvia clock update
    startClockUpdate();

    // 8. Registra event delegation globale
    registerGlobalEventDelegation();

    // 9. Cleanup quando si esce dalla pagina
    window.addEventListener('beforeunload', cleanup);

    console.log('[AdminWorkService] Page initialized successfully');
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
    // Evita duplicati
    if (pollingIntervalId) {
        console.warn('[AdminWorkService] Polling already active, skipping');
        return;
    }

    pollingIntervalId = setInterval(async () => {
        const selectedDay = workServiceState.selectedDayId;
        if (selectedDay) {
            await pollRefresh(selectedDay);
        }
    }, POLLING_INTERVAL);

    console.log(`[AdminWorkService] Polling started (every ${POLLING_INTERVAL}ms)`);
}

/**
 * Ferma il polling
 */
function stopPolling() {
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
        console.log('[AdminWorkService] Polling stopped');
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

    console.log('[AdminWorkService] Clock update started');
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
    console.log('[AdminWorkService] Cleanup completed');
}

/**
 * Registra event delegation globale
 * 
 * Gestisce eventi che non sono gestiti dai componenti:
 * - Open/Close sidebar (mobile)
 * - Toggle recap mobile
 * - Chiusura modal recap (mobile)
 * - Altri eventi globali
 */
function registerGlobalEventDelegation() {
    const page = workServiceView.page;
    if (!page) return;

    page.addEventListener('click', (event) => {
        const target = event.target;

        // Open sidebar (hamburger)
        if (target.closest('[data-action="open-sidebar"]')) {
            event.preventDefault();
            openSidebar();
            return;
        }

        // Close sidebar
        if (target.closest('[data-action="close-sidebar"]')) {
            event.preventDefault();
            closeSidebar();
            return;
        }

        // Toggle recap mobile
        if (target.closest('[data-action="toggle-recap"]')) {
            event.preventDefault();
            toggleRecapMobile();
            return;
        }

        // Close recap modal (legacy, kept for compatibility)
        if (target.closest('[data-action="close-recap"]')) {
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

    console.log('[AdminWorkService] Global event delegation registered');
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

/**
 * Toggle recap mobile (espande/collassa)
 */
function toggleRecapMobile() {
    const recapMobile = document.querySelector('[data-recap-mobile]');
    if (!recapMobile) return;
    
    // Toggle tra espanso e collassato
    if (recapMobile.classList.contains('translate-y-0')) {
        recapMobile.classList.remove('translate-y-0');
        recapMobile.classList.add('translate-y-[calc(100%-3rem)]');
    } else {
        recapMobile.classList.remove('translate-y-[calc(100%-3rem)]');
        recapMobile.classList.add('translate-y-0');
    }
}

// Export for app.js
export default { initAdminWorkServicePage };
