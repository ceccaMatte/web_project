/**
 * HOME PAGE - Orchestratore
 * 
 * RESPONSABILITÀ:
 * - Entry point della pagina Home
 * - Inizializzazione view refs
 * - Trigger hydration iniziale
 * - Nessuna logica business (delegata ai moduli)
 * 
 * ARCHITETTURA MODULARE:
 * 
 * home.state.js        → SSOT, mutation helpers
 * home.view.js         → DOM refs
 * home.api.js          → fetch API
 * home.hydration.js    → idratazione state
 * home.actions.js      → azioni utente (sidebar, selectDay)
 * home.render.js       → orchestrazione render componenti
 * 
 * COMPONENTI RIUTILIZZABILI:
 * 
 * components/topbar/               → TopBar (logo + hamburger)
 * components/sidebar/              → Sidebar + overlay
 * components/todayServiceCard/     → Card servizio oggi
 * components/weekScheduler/        → Scheduler settimanale
 * components/ordersPreviewCard/    → Card preview ordini
 * components/timeSlotCard/         → Slot prenotabili
 * 
 * UTILITIES:
 * 
 * utils/dom.js         → Query selectors, DOM helpers
 * utils/a11y.js        → Focus trap, keyboard nav, ARIA
 * config/ui.config.js  → Colori, icone, labels, a11y
 * 
 * PATTERN:
 * - SSOT: homeState centralizza tutti i dati
 * - Stateless components: ricevono props + callbacks
 * - Unidirectional data flow: action → state → render
 * - Event delegation locale nei componenti
 * - Accessibilità WCAG AAA
 * 
 * COME RIUSARE I COMPONENTI IN ALTRE PAGINE:
 * 
 * 1. Importa il component renderer:
 *    import { renderTopBar } from '@/components/topbar/topbar.component.js';
 * 
 * 2. Prepara container, props, callbacks:
 *    const container = document.querySelector('[data-my-topbar]');
 *    const props = { user: { authenticated: true, name: 'Mario' }, sidebarOpen: false };
 *    const callbacks = { onToggleSidebar: (isOpen) => console.log(isOpen) };
 * 
 * 3. Chiama il renderer:
 *    renderTopBar(container, props, callbacks);
 * 
 * I componenti sono STATELESS: non importano homeState,
 * sono completamente riutilizzabili con dati e callback esterni.
 */

import { homeView } from './home.view.js';
import { refreshHomeState } from './home.hydration.js';
import { bookSlot, logout, selectDay, loadInitialTimeSlots, startPolling, stopPolling } from './home.actions.js';

/**
 * Inizializza pagina Home
 * 
 * WORKFLOW:
 * 1. Inizializza DOM refs
 * 2. Fetch e hydrate stato da API
 * 3. Carica time slots iniziali basati su selectedDate
 * 4. Avvia polling automatico ogni 5 secondi  
 * 5. Registra event delegation globale
 * 6. Setup cleanup su page unload
 * 
 * Chiamato da app.js quando data-page="home".
 */
export async function initHomePage() {
    console.log('[Home] Initializing home page...');

    try {
        // 1. Inizializza riferimenti DOM
        homeView.init();

        // 2. Fetch stato iniziale (user, scheduler, today service, etc.)
        await refreshHomeState();

        // 3. Carica time slots iniziali 
        // (per selectedDate determinato dalle regole: oggi o primo giorno attivo)
        await loadInitialTimeSlots();

        // 4. Avvia polling automatico ogni 5 secondi
        // (aggiorna truck card, ordini utente today, time slots selectedDate)
        startPolling();

        // 5. Registra event delegation globale per azioni
        document.addEventListener('click', handleGlobalActions);

        // 6. Setup cleanup polling su page unload
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('pagehide', cleanup);

        console.log('[Home] Home page initialized successfully');
        
    } catch (error) {
        console.error('[Home] Failed to initialize home page:', error);
        // Continua comunque con UI base
    }
}

/**
 * Gestisce azioni globali tramite event delegation
 * 
 * Pattern: data-action="nome-azione"
 * Supporta: book-slot, logout, select-day
 * 
 * @param {Event} event - Click event
 */
function handleGlobalActions(event) {
    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;

    switch (action) {
        case 'book-slot':
            event.preventDefault();
            bookSlot(actionTarget);  // Passa l'elemento per accedere ai dataset
            break;
            
        case 'logout':
            event.preventDefault();
            logout();
            break;
            
        case 'select-day':
            const dayId = actionTarget.dataset.dayId;
            if (dayId) {
                event.preventDefault();
                selectDay(dayId);
            }
            break;
            
        default:
            // Altre azioni già gestite nei componenti
            break;
    }
}

/**
 * Cleanup risorse (polling, event listeners)
 * 
 * Chiamata su page unload per evitare memory leak.
 * IMPORTANTE: Ferma il polling per non fare richieste dopo page unload.
 */
function cleanup() {
    console.log('[Home] Cleaning up home page resources...');
    
    // Ferma polling
    stopPolling();
    
    // Rimuovi event listeners globali
    document.removeEventListener('click', handleGlobalActions);
    window.removeEventListener('beforeunload', cleanup);
    window.removeEventListener('pagehide', cleanup);
}

/**
 * Export default per import aggregato
 */
export default {
    initHomePage,
};
