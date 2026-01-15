/**
 * HOME PAGE - State Management & UI Logic
 * 
 * PATTERN ARCHITETTURALE:
 * - homeState: SSOT (Single Source of Truth) - contiene SOLO dati
 * - homeView: riferimenti DOM + funzioni render
 * - Unidirectional data flow: evento → modifica state → render
 * 
 * RESPONSABILITÀ:
 * - Gestione apertura/chiusura sidebar
 * - Event delegation (data-action)
 * - Render deterministico basato su stato
 * 
 * COSA NON FA:
 * - Nessun fetch (i dati arrivano dal backend)
 * - Nessun DOM reference in homeState
 * - Nessuna logica inline
 */

/**
 * STATO GLOBALE PAGINA (SSOT)
 * 
 * Contiene SOLO dati, mai riferimenti DOM.
 * Tutti i componenti leggono da qui.
 */
const homeState = {
    /**
     * User state (ricevuto dal backend via Blade)
     * - authenticated: boolean
     * - enabled: boolean
     * - name: string|null
     */
    user: {
        authenticated: false,
        enabled: false,
        name: null,
    },

    /**
     * Sidebar state
     * - sidebarOpen: boolean
     */
    sidebarOpen: false,

    /**
     * Today Service state (ricevuto dal backend via Blade)
     * - status: 'active' | 'inactive'
     * - location: string | null
     * - startTime: string | null
     * - endTime: string | null
     * - queueTime: number | null (minuti)
     * 
     * IMPORTANTE: Questo stato può essere aggiornato via polling in futuro.
     */
    todayService: {
        status: 'inactive',
        location: null,
        startTime: null,
        endTime: null,
        queueTime: null,
    },

    /**
     * TODO: Aggiungere in futuro
     * - workingDays: []
     * - timeSlots: []
     * - userOrders: []
     * - selectedDate: string
     */
};

/**
 * VIEW LAYER
 * 
 * Contiene:
 * - Riferimenti DOM (cached)
 * - Funzioni di render
 * 
 * NON contiene dati applicativi.
 */
const homeView = {
    /**
     * Riferimenti DOM (cached una sola volta)
     */
    refs: {
        sidebar: null,
        overlay: null,
        truckStatusSection: null,
    },

    /**
     * Inizializza riferimenti DOM.
     * Chiamato una sola volta all'avvio.
     */
    init() {
        this.refs.sidebar = document.querySelector('[data-sidebar]');
        this.refs.overlay = document.querySelector('[data-overlay]');
        this.refs.truckStatusSection = document.querySelector('[data-truck-status-section]');

        if (!this.refs.sidebar) {
            console.error('[Home] Sidebar element not found');
        }
        if (!this.refs.overlay) {
            console.error('[Home] Overlay element not found');
        }
        if (!this.refs.truckStatusSection) {
            console.error('[Home] Truck status section not found');
        }
    },

    /**
     * Renderizza lo stato della sidebar.
     * 
     * LOGICA:
     * - Se sidebarOpen === true:
     *   - Rimuove -translate-x-full dalla sidebar (appare)
     *   - Mostra overlay su mobile
     * - Se sidebarOpen === false:
     *   - Aggiunge -translate-x-full alla sidebar (nasconde)
     *   - Nasconde overlay
     * 
     * @param {boolean} isOpen - Stato sidebar da homeState
     */
    renderSidebar(isOpen) {
        if (!this.refs.sidebar || !this.refs.overlay) {
            console.warn('[Home] Cannot render sidebar: refs not initialized');
            return;
        }

        if (isOpen) {
            // APRI SIDEBAR (da DESTRA)
            this.refs.sidebar.classList.remove('translate-x-full');
            this.refs.overlay.classList.remove('hidden');
        } else {
            // CHIUDI SIDEBAR (verso DESTRA)
            this.refs.sidebar.classList.add('translate-x-full');
            this.refs.overlay.classList.add('hidden');
        }
    },

    /**
     * Renderizza il truck status card basandosi su homeState.todayService.
     * 
     * RESPONSABILITÀ:
     * - Legge SOLO da homeState (mai da DOM)
     * - Decide quale versione del componente mostrare
     * - Monta il componente Blade nel container
     * 
     * COSA NON FA:
     * - NON fa fetch
     * - NON modifica homeState
     * - NON calcola stati di business
     * 
     * SUPPORTA CHIAMATE MULTIPLE:
     * - Questa funzione può essere chiamata N volte (per polling futuro)
     * - Sostituisce sempre il contenuto del container
     * 
     * @param {object} serviceData - Dati da homeState.todayService
     */
    renderTruckStatus(serviceData) {
        if (!this.refs.truckStatusSection) {
            console.warn('[Home] Cannot render truck status: section not found');
            return;
        }

        const { status, location, startTime, endTime, queueTime } = serviceData;

        let componentHTML = '';

        if (status === 'active') {
            // STATO ATTIVO: servizio disponibile oggi
            componentHTML = `
                <div class="relative overflow-hidden rounded-2xl bg-surface-dark border border-border-dark p-5 shadow-xl" data-truck-status-card>
                    <header class="flex justify-between items-start mb-4">
                        <div class="flex flex-col gap-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="relative flex h-2 w-2" aria-hidden="true">
                                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span class="text-emerald-500 text-[10px] font-bold uppercase tracking-widest" role="status">
                                    LIVE NOW (TODAY)
                                </span>
                            </div>
                            <h2 class="text-white text-lg font-bold">
                                ${location}
                            </h2>
                            <p class="text-slate-400 text-xs">
                                <time datetime="${startTime}">${startTime}</time> – <time datetime="${endTime}">${endTime}</time>
                            </p>
                        </div>
                        <div class="size-20 rounded-xl bg-surface-dark border border-border-dark flex items-center justify-center text-slate-500">
                            <span class="material-symbols-outlined text-4xl" aria-label="Truck">
                                local_shipping
                            </span>
                        </div>
                    </header>
                    <div class="flex items-center justify-between p-3 rounded-xl border border-border-dark/60 bg-background-dark/40 mt-2">
                        <div class="flex items-center gap-3">
                            <div class="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                                <span class="material-symbols-outlined text-lg" aria-label="Physical Queue">
                                    person_pin_circle
                                </span>
                            </div>
                            <div>
                                <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">
                                    Physical Queue
                                </p>
                                <p class="text-xs font-medium text-slate-400">
                                    Walk-up wait time
                                </p>
                            </div>
                        </div>
                        <div class="text-xl font-bold text-slate-300" aria-label="${queueTime} minutes wait">
                            ${queueTime} min
                        </div>
                    </div>
                </div>
            `;
        } else if (status === 'inactive') {
            // STATO INATTIVO: servizio non disponibile oggi
            componentHTML = `
                <div class="relative overflow-hidden rounded-2xl bg-surface-dark border border-border-dark p-5 shadow-xl" data-truck-status-card>
                    <header class="flex items-center gap-3 mb-4">
                        <span class="material-symbols-outlined text-2xl text-slate-500" aria-label="Service Unavailable">
                            block
                        </span>
                        <span class="text-slate-500 text-[10px] font-bold uppercase tracking-widest" role="status">
                            SERVICE NOT AVAILABLE
                        </span>
                    </header>
                    <div class="flex flex-col items-center justify-center py-10">
                        <p class="text-slate-400 text-base font-bold mb-2">
                            Coming soon
                        </p>
                    </div>
                </div>
            `;
        }

        // Monta il componente nel container
        this.refs.truckStatusSection.innerHTML = componentHTML;

        console.log('[Home] Truck status rendered:', status);
    },
};

/**
 * EVENT HANDLERS
 * 
 * Gestisce eventi UI tramite event delegation.
 * Pattern: data-action="nome-azione"
 */
const homeHandlers = {
    /**
     * Apre la sidebar.
     * Modifica stato → trigger render.
     */
    openSidebar() {
        homeState.sidebarOpen = true;
        homeView.renderSidebar(homeState.sidebarOpen);
    },

    /**
     * Chiude la sidebar.
     * Modifica stato → trigger render.
     */
    closeSidebar() {
        homeState.sidebarOpen = false;
        homeView.renderSidebar(homeState.sidebarOpen);
    },

    /**
     * Event delegation handler.
     * Delega eventi in base a data-action.
     * 
     * @param {Event} event - Click event
     */
    handleAction(event) {
        // Trova elemento con data-action (supporta bubbling)
        const target = event.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;

        // Dispatch azione
        switch (action) {
            case 'open-sidebar':
                this.openSidebar();
                break;
            case 'close-sidebar':
                this.closeSidebar();
                break;
            default:
                console.warn(`[Home] Unknown action: ${action}`);
        }
    },
};

/**
 * INIZIALIZZAZIONE PAGINA
 * 
 * Entry point chiamato da app.js quando data-page="home".
 */
export function initHomePage() {
    console.log('[Home] Initializing...');

    // 1. Inizializza riferimenti DOM
    homeView.init();

    // 2. Leggi stato user dal backend (passato via Blade)
    // Cerca elemento con data-user-state (JSON inline)
    const userStateElement = document.querySelector('[data-user-state]');
    if (userStateElement) {
        try {
            const userData = JSON.parse(userStateElement.textContent);
            homeState.user = userData;
            console.log('[Home] User state loaded:', homeState.user);
        } catch (error) {
            console.error('[Home] Failed to parse user state:', error);
        }
    }

    // 3. Leggi dati today service dal backend (passato via Blade)
    // Cerca elemento con data-today-service (JSON inline)
    const todayServiceElement = document.querySelector('[data-today-service]');
    if (todayServiceElement) {
        try {
            const serviceData = JSON.parse(todayServiceElement.textContent);
            homeState.todayService = serviceData;
            console.log('[Home] Today service loaded:', homeState.todayService);
        } catch (error) {
            console.error('[Home] Failed to parse today service:', error);
        }
    }

    // 4. Render iniziale
    homeView.renderSidebar(homeState.sidebarOpen);
    homeView.renderTruckStatus(homeState.todayService);

    // 5. Event delegation su document
    // Tutti i click passano per handleAction
    document.addEventListener('click', (event) => {
        homeHandlers.handleAction(event);
    });

    console.log('[Home] Initialized successfully');
}
