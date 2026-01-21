// Service planning page entrypoint

import { servicePlanningView } from './servicePlanning.view.js';
import { servicePlanningState, mutateUser, mutateConfigDefaults, mutateWeek, 
         mutateGlobalConstraints, mutateDays, mutateLoading,
         saveInitialSnapshot } from './servicePlanning.state.js';
import { renderServicePlanningPage, setCallbacks } from './servicePlanning.render.js';
import { goToPrevWeek, goToNextWeek, goToDate, loadWeekData, 
         incrementMaxOrders, decrementMaxOrders, incrementMaxPendingTime, decrementMaxPendingTime, updateLocation,
         toggleDay, updateDayStartTime, updateDayEndTime, saveChanges,
         openDatePicker, onDatePickerChange, isDayEditable } from './servicePlanning.actions.js';

const DEBUG = false;

function debugLog() {}

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
    debugLog('init', 'Inizializzazione pagina...');

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
        goToDate,
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
    
    debugLog('init', `Caricamento dati iniziali per settimana: ${weekStart}`);
    await loadWeekData(weekStart);

    // 6. Registra event delegation globale
    registerGlobalEventDelegation();

    debugLog('init', 'Pagina inizializzata con successo');
    exposeDebugUtilities();
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
        debugLog('hydrateUser', 'User hydrated:', userData);
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
        debugLog('hydrateConfig', 'Config defaults hydrated:', configData);
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
 * 
 * NOTA: Gli eventi click sui link della sidebar NON devono essere intercettati
 * per permettere la navigazione normale del browser
 */
function registerGlobalEventDelegation() {
    const page = servicePlanningView.page;
    if (!page) return;

    // Click delegation
    page.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        debugLog('click', `Action: ${action}`);

        // IMPORTANTE: Non gestire i click sui link <a> per permettere la navigazione
        if (target.tagName === 'A' && target.href) {
            debugLog('click', 'Link click, allowing default navigation');
            return; // Permetti navigazione normale
        }

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
            case 'open-date-picker':
                // Gestito dal componente weekSelector
                break;
        }
    });

    // Toggle day delegation
    page.addEventListener('change', (e) => {
        const target = e.target;
        
        // Day toggle
        if (target.matches('[data-day-toggle]')) {
            const date = target.dataset.dayToggle;
            
            // GUARD: verifica che il giorno sia editabile
            if (!isDayEditable(date)) {
                debugLog('change', `Toggle giorno ${date} bloccato - non editabile`);
                e.preventDefault();
                return;
            }
            
            toggleDay(date);
        }
        
        // Date picker change (gestito dal componente weekSelector)
        if (target.matches('[data-week-date-picker]')) {
            const selectedDate = target.value;
            if (selectedDate) {
                debugLog('change', 'Date picker selezionato:', selectedDate);
                goToDate(selectedDate);
            }
        }
    });

    // Location input
    page.addEventListener('input', (e) => {
        if (e.target.matches('[data-location-input]')) {
            updateLocation(e.target.value);
        }
    });

    // Custom events per time changes (dal componente dayConfigCard)
    page.addEventListener('startTimeChange', (e) => {
        const { date, time } = e.detail;
        updateDayStartTime(date, time);
    });

    page.addEventListener('endTimeChange', (e) => {
        const { date, time } = e.detail;
        updateDayEndTime(date, time);
    });

    // Keyboard support per date picker e altri elementi
    page.addEventListener('keydown', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        // Enter o Space attivano l'azione
        if (e.key === 'Enter' || e.key === ' ') {
            const action = target.dataset.action;
            
            // Non interferire con i link
            if (target.tagName === 'A') return;
            
            if (action === 'open-date-picker') {
                e.preventDefault();
                // L'evento è gestito dal componente weekSelector
            }
        }
    });

    debugLog('events', 'Event delegation globale registrata');
}

/**
 * Apre la sidebar (mobile)
 */
function openSidebar() {
    debugLog('sidebar', 'Apertura sidebar');
    
    const sidebar = servicePlanningView.sidebar;
    const backdrop = servicePlanningView.sidebarBackdrop;

    if (sidebar) {
        sidebar.classList.remove('translate-x-full');
    }
    if (backdrop) {
        backdrop.classList.remove('hidden');
    }
}

/**
 * Chiude la sidebar (mobile)
 */
function closeSidebar() {
    debugLog('sidebar', 'Chiusura sidebar');
    
    const sidebar = servicePlanningView.sidebar;
    const backdrop = servicePlanningView.sidebarBackdrop;

    if (sidebar) {
        sidebar.classList.add('translate-x-full');
    }
    if (backdrop) {
        backdrop.classList.add('hidden');
    }
}

/**
 * Esponi utility di debug sulla window per uso in console del browser
 */
function exposeDebugUtilities() {
    if (typeof window !== 'undefined') {
        window.servicePlanningDebug = {
            getState: () => servicePlanningState,
            printState: () => console.log(servicePlanningState),
            goToDate: goToDate,
            loadWeek: loadWeekData,
            save: saveChanges,
            testDirtyState: () => {
                const currentMax = servicePlanningState.globalConstraints.maxOrdersPerSlot;
                incrementMaxOrders();
                return {
                    maxOrdersPerSlot: servicePlanningState.globalConstraints.maxOrdersPerSlot,
                    isDirty: servicePlanningState.isDirty
                };
            },
            getViewRefs: () => servicePlanningView,
        };
    }
}

// Export for app.js
export default { initServicePlanningPage };
