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

/**
 * Inizializza pagina Home
 * 
 * WORKFLOW:
 * 1. Inizializza DOM refs
 * 2. Fetch e hydrate stato da API
 * 3. Render completo UI
 * 
 * Chiamato da app.js quando data-page="home".
 */
export async function initHomePage() {
    console.log('[Home] Initializing home page...');

    // 1. Inizializza riferimenti DOM
    homeView.init();

    // 2. Fetch stato iniziale e render
    await refreshHomeState();

    console.log('[Home] Home page initialized successfully');
}

/**
 * Export default per import aggregato
 */
export default {
    initHomePage,
};
