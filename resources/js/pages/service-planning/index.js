/**
 * SERVICE PLANNING PAGE - Orchestratore
 * 
 * RESPONSABILITÀ:
 * - Entry point della pagina Service Planning
 * - Inizializzazione view refs
 * - Trigger hydration iniziale
 * - Event delegation globale
 * 
 * ARCHITETTURA MODULARE:
 * 
 * servicePlanning.state.js    → SSOT, mutation helpers
 * servicePlanning.view.js     → DOM refs
 * servicePlanning.api.js      → fetch API
 * servicePlanning.actions.js  → azioni utente
 * servicePlanning.render.js   → orchestrazione render componenti
 */

import { servicePlanningView } from './servicePlanning.view.js';
import { servicePlanningState, mutateUser, mutateConfigDefaults, mutateWeek, 
         mutateGlobalConstraints, setOriginalGlobalConstraints, mutateDays, setOriginalDays,
         mutateLoading } from './servicePlanning.state.js';
import { renderServicePlanningPage, setCallbacks } from './servicePlanning.render.js';
import { goToPrevWeek, goToNextWeek, loadWeekData, 
         incrementMaxOrders, decrementMaxOrders, incrementMaxPendingTime, decrementMaxPendingTime, updateLocation,
         toggleDay, updateDayStartTime, updateDayEndTime, saveChanges } from './servicePlanning.actions.js';
import { addClass, removeClass, listen } from '../../utils/dom.js';

/**
 * Inizializza pagina Service Planning
 * 
 * WORKFLOW:
 * 1. Inizializza DOM refs
 * 2. Hydrate dati inline (user, config defaults)
 * 3. Calcola settimana corrente
 * 4. Mostra loader iniziale
 * 5. Fetch stato da API per settimana corrente
 * 6. Render completo UI
 * 7. Registra event delegation globale
 * 
 * Chiamato da app.js quando data-page="service-planning".
 */
export async function initServicePlanningPage() {
    console.log('[ServicePlanning] Initializing page...');

    // 1. Inizializza riferimenti DOM
    servicePlanningView.init();

    // 2. Hydrate user da DOM
    hydrateUserFromDOM();

    // 3. Hydrate config defaults da DOM
    hydrateConfigDefaultsFromDOM();

    // 4. Set callbacks for render
    setCallbacks({
        goToPrevWeek,
        goToNextWeek,
        incrementMaxOrders,
        decrementMaxOrders,
        incrementMaxPendingTime,
        decrementMaxPendingTime,
        updateLocation,
        toggleDay,
        updateDayStartTime,
        updateDayEndTime,
        saveChanges,
    });

    // 5. Calcola settimana corrente e carica dati
    const today = new Date();
    const weekStart = getWeekStart(today);
    
    console.log(`[ServicePlanning] Loading initial data for week starting: ${weekStart}`);
    await loadWeekData(weekStart);

    // 6. Registra event delegation globale
    registerGlobalEventDelegation();

    console.log('[ServicePlanning] Page initialized successfully');
}

/**
 * Hydrate user state da script inline
 */
function hydrateUserFromDOM() {
    const script = servicePlanningView.userStateScript;
    if (!script) {
        console.warn('[ServicePlanning] User state script not found');
        return;
    }

    try {
        const userData = JSON.parse(script.textContent);
        mutateUser({
            authenticated: userData.authenticated || false,
            name: userData.name || null,
            nickname: userData.nickname || null,
            role: userData.role || null,
        });
        console.log('[ServicePlanning] User hydrated from DOM');
    } catch (error) {
        console.error('[ServicePlanning] Failed to parse user state:', error);
    }
}

/**
 * Hydrate config defaults da script inline
 */
function hydrateConfigDefaultsFromDOM() {
    const script = servicePlanningView.configDefaultsScript;
    if (!script) {
        console.warn('[ServicePlanning] Config defaults script not found');
        return;
    }

    try {
        const configData = JSON.parse(script.textContent);
        mutateConfigDefaults(configData);
        console.log('[ServicePlanning] Config defaults hydrated from DOM:', configData);
    } catch (error) {
        console.error('[ServicePlanning] Failed to parse config defaults:', error);
    }
}

/**
 * Get Monday of the week for a given date
 */
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    d.setDate(diff);
    return formatDate(d);
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Registra event delegation globale
 */
function registerGlobalEventDelegation() {
    const page = servicePlanningView.page;
    if (!page) return;

    // Click delegation
    page.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        console.log(`[ServicePlanning] Action clicked: ${action}`);

        switch (action) {
            case 'open-sidebar':
                openSidebar();
                break;
            case 'close-sidebar':
                closeSidebar();
                break;
            case 'save-changes':
                saveChanges();
                break;
            case 'prev-week':
                goToPrevWeek();
                break;
            case 'next-week':
                goToNextWeek();
                break;
            case 'increment-max-orders':
                incrementMaxOrders();
                break;
            case 'decrement-max-orders':
                decrementMaxOrders();
                break;
            case 'increment-max-pending-time':
                incrementMaxPendingTime();
                break;
            case 'decrement-max-pending-time':
                decrementMaxPendingTime();
                break;
        }
    });

    // Toggle day delegation
    page.addEventListener('change', (e) => {
        const target = e.target;
        
        // Day toggle
        if (target.matches('[data-day-toggle]')) {
            const date = target.dataset.dayToggle;
            toggleDay(date);
        }
        
        // Start time select
        if (target.matches('[data-start-time]')) {
            const date = target.dataset.startTime;
            updateDayStartTime(date, target.value);
        }
        
        // End time select
        if (target.matches('[data-end-time]')) {
            const date = target.dataset.endTime;
            updateDayEndTime(date, target.value);
        }
    });

    // Location input
    page.addEventListener('input', (e) => {
        if (e.target.matches('[data-location-input]')) {
            updateLocation(e.target.value);
        }
    });

    console.log('[ServicePlanning] Global event delegation registered');
}

/**
 * Apre la sidebar (mobile)
 */
function openSidebar() {
    const sidebar = servicePlanningView.sidebar;
    const backdrop = servicePlanningView.sidebarBackdrop;

    if (sidebar) {
        removeClass(sidebar, 'translate-x-full');
    }
    if (backdrop) {
        removeClass(backdrop, 'hidden');
    }
}

/**
 * Chiude la sidebar (mobile)
 */
function closeSidebar() {
    const sidebar = servicePlanningView.sidebar;
    const backdrop = servicePlanningView.sidebarBackdrop;

    if (sidebar) {
        addClass(sidebar, 'translate-x-full');
    }
    if (backdrop) {
        addClass(backdrop, 'hidden');
    }
}

// Export for app.js
export default { initServicePlanningPage };
