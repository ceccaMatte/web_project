/**
 * HOME ACTIONS LAYER
 * 
 * RESPONSABILITÀ:
 * - Gestisce azioni utente sulla pagina Home
 * - Modifica homeState in risposta ad eventi
 * - Trigger render mirati o completi
 * 
 * ARCHITETTURA:
 * - Ogni action è una funzione che modifica state + rende
 * - Importato da componenti come callbacks
 * - Può chiamare API per fetch dati aggiuntivi
 * 
 * UTILIZZO:
 * import { openSidebar, closeSidebar, selectDay } from './home.actions.js';
 * 
 * // Da component callback:
 * onToggleSidebar: (isOpen) => isOpen ? openSidebar() : closeSidebar()
 */

import { homeState, mutateSidebar, mutateSelectedDay } from './home.state.js';
import { fetchBookingForDay } from './home.api.js';
import { renderHome } from './home.render.js';
import { renderSidebar } from '../../components/sidebar/sidebar.component.js';
import { renderTopBar } from '../../components/topbar/topbar.component.js';
import { renderWeekScheduler } from '../../components/weekScheduler/weekScheduler.component.js';
import { homeView } from './home.view.js';

/**
 * Apri sidebar
 * 
 * WORKFLOW:
 * 1. Aggiorna homeState.sidebarOpen = true
 * 2. Re-render sidebar + topbar
 */
export function openSidebar() {
    console.log('[Actions] Opening sidebar');
    
    mutateSidebar(true);
    
    // Render solo sidebar e topbar (ottimizzazione)
    renderSidebar(
        homeView.refs.sidebar,
        homeView.refs.overlay,
        { open: true, user: homeState.user },
        { onClose: closeSidebar }
    );

    // Re-render topbar per cambiare icona
    renderTopBar(
        homeView.refs.topBar,
        { user: homeState.user, sidebarOpen: true },
        { onToggleSidebar: (isOpen) => isOpen ? openSidebar() : closeSidebar() }
    );
}

/**
 * Chiudi sidebar
 * 
 * WORKFLOW:
 * 1. Aggiorna homeState.sidebarOpen = false
 * 2. Re-render sidebar + topbar
 */
export function closeSidebar() {
    console.log('[Actions] Closing sidebar');
    
    mutateSidebar(false);
    
    // Render solo sidebar e topbar
    renderSidebar(
        homeView.refs.sidebar,
        homeView.refs.overlay,
        { open: false, user: homeState.user },
        { onClose: closeSidebar }
    );

    // Re-render topbar per cambiare icona
    renderTopBar(
        homeView.refs.topBar,
        { user: homeState.user, sidebarOpen: false },
        { onToggleSidebar: (isOpen) => isOpen ? openSidebar() : closeSidebar() }
    );
}

/**
 * Seleziona giorno nello scheduler
 * 
 * WORKFLOW:
 * 1. Aggiorna homeState.selectedDayId
 * 2. Aggiorna weekDays.isSelected
 * 3. Fetch booking slots per quel giorno (TODO: se API disponibile)
 * 4. Re-render scheduler + booking slots
 * 
 * @param {string} dayId - ID giorno (YYYY-MM-DD)
 */
export async function selectDay(dayId) {
    console.log(`[Actions] Selecting day: ${dayId}`);
    
    if (!dayId) {
        console.warn('[Actions] selectDay: dayId is required');
        return;
    }

    // 1. Aggiorna state
    mutateSelectedDay(dayId);
    console.log('[Actions] State updated, weekDays:', homeState.weekDays.map(d => ({id: d.id, isSelected: d.isSelected})));

    // 2. Re-render scheduler
    renderWeekScheduler(
        homeView.refs.schedulerSection,
        { monthLabel: homeState.monthLabel, weekDays: homeState.weekDays },
        { onDaySelected: selectDay }
    );

    console.log(`[Actions] Day selected: ${dayId}`);
}

/**
 * Export default per import aggregato
 */
export default {
    openSidebar,
    closeSidebar,
    selectDay,
};
