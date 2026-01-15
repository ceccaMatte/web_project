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
     * Week Scheduler state (ricevuto dal backend via Blade)
     * - selectedDayId: string (YYYY-MM-DD) - giorno attualmente visualizzato
     * - monthLabel: string (es. "January 2026")
     * - weekDays: array di 7 oggetti con struttura:
     *   {
     *     id: "2026-01-15",
     *     weekday: "WED",
     *     dayNumber: "15",
     *     isToday: bool,
     *     isActive: bool,
     *     isDisabled: bool,
     *     isSelected: bool
     *   }
     * 
     * IMPORTANTE: selectedDayId cambia al click su un giorno.
     */
    selectedDayId: null,
    monthLabel: null,
    weekDays: [],

    /**
     * Order Preview state (computato da computeOrdersPreviewState)
     * 
     * VARIANTI (mutuamente esclusive):
     * - login-cta: utente non loggato
     * - empty: utente loggato, 0 ordini
     * - single: utente loggato, 1 ordine
     * - multi: utente loggato, 2+ ordini
     * 
     * STRUTTURA:
     * - variant: 'login-cta' | 'empty' | 'single' | 'multi'
     * - ordersCount: numero totale ordini
     * - selectedOrder: ordine più rilevante (null se login-cta o empty)
     *   - id: string|number
     *   - status: 'rejected'|'ready'|'confirmed'|'pending'|'picked_up'
     *   - statusLabel: string preformattata (es. "READY AT 12:45 PM")
     */
    ordersPreview: {
        variant: 'login-cta',
        ordersCount: 0,
        selectedOrder: null,
    },
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
        schedulerSection: null,
        orderPreviewSection: null,
        orderPreviewContainer: null,
        viewAllButton: null,
    },

    /**
     * Inizializza riferimenti DOM.
     * Chiamato una sola volta all'avvio.
     */
    init() {
        this.refs.sidebar = document.querySelector('[data-sidebar]');
        this.refs.overlay = document.querySelector('[data-overlay]');
        this.refs.truckStatusSection = document.querySelector('[data-truck-status-section]');
        this.refs.schedulerSection = document.querySelector('[data-scheduler-section]');
        this.refs.orderPreviewSection = document.querySelector('[data-order-preview-section]');
        this.refs.orderPreviewContainer = document.querySelector('[data-order-preview-container]');
        this.refs.viewAllButton = document.querySelector('[data-view-all-button]');

        if (!this.refs.sidebar) {
            console.error('[Home] Sidebar element not found');
        }
        if (!this.refs.overlay) {
            console.error('[Home] Overlay element not found');
        }
        if (!this.refs.truckStatusSection) {
            console.error('[Home] Truck status section not found');
        }
        if (!this.refs.schedulerSection) {
            console.error('[Home] Scheduler section not found');
        }
        if (!this.refs.orderPreviewSection) {
            console.error('[Home] Order preview section not found');
        }
        if (!this.refs.orderPreviewContainer) {
            console.error('[Home] Order preview container not found');
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

    /**
     * Renderizza il week scheduler basandosi su homeState.weekDays.
     * 
     * RESPONSABILITÀ:
     * - Legge SOLO da homeState (mai da DOM)
     * - Monta il componente week-scheduler nel container
     * - Applica stili basati su stati (disabled, selected, today, active)
     * 
     * COSA NON FA:
     * - NON fa fetch
     * - NON modifica homeState
     * - NON gestisce click (delegato a homeHandlers)
     * 
     * SUPPORTA CHIAMATE MULTIPLE:
     * - Può essere chiamata N volte per aggiornare il render
     * - Sostituisce sempre il contenuto del container
     * 
     * @param {object} schedulerData - Dati da homeState (monthLabel, weekDays)
     */
    renderScheduler(schedulerData) {
        if (!this.refs.schedulerSection) {
            console.warn('[Home] Cannot render scheduler: section not found');
            return;
        }

        const { monthLabel, weekDays } = schedulerData;

        // Header
        let headerHTML = `
            <div class="flex items-center justify-between">
                <h2 class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Schedule
                </h2>
                <span class="text-primary text-[10px] font-bold uppercase tracking-widest">
                    ${monthLabel}
                </span>
            </div>
        `;

        // Day Selector
        let daysHTML = '<div class="bg-surface-dark border border-border-dark rounded-2xl p-2"><div class="flex justify-between gap-1">';

        weekDays.forEach(day => {
            const { id, weekday, dayNumber, isToday, isActive, isDisabled, isSelected } = day;

            // Calcola classi CSS (priorità: selected > today > disabled > active)
            let baseClasses = 'flex flex-col items-center justify-center flex-1 py-3 rounded-xl transition-all';
            let stateClasses = '';
            let weekdayColor = '';
            let numberColor = '';

            if (isDisabled) {
                stateClasses = 'opacity-30 cursor-not-allowed';
                weekdayColor = 'text-slate-500';
                numberColor = 'text-slate-400';
            } else if (isSelected) {
                stateClasses = 'border border-primary bg-primary/10 shadow-lg shadow-primary/20';
                weekdayColor = 'text-primary';
                numberColor = 'text-white';
            } else if (isActive) {
                stateClasses = 'hover:bg-slate-800 active:scale-95 cursor-pointer';
                weekdayColor = 'text-slate-400';
                numberColor = 'text-slate-300';
            } else {
                stateClasses = 'opacity-30';
                weekdayColor = 'text-slate-500';
                numberColor = 'text-slate-400';
            }

            const allClasses = `${baseClasses} ${stateClasses}`;

            if (isDisabled) {
                // Giorno disabled: <div> non cliccabile
                daysHTML += `
                    <div 
                        class="${allClasses}"
                        aria-disabled="true"
                        ${isToday ? 'aria-current="date"' : ''}
                    >
                        <span class="text-[9px] font-medium uppercase mb-1 ${weekdayColor}">
                            ${weekday}
                        </span>
                        <span class="text-base font-bold ${numberColor}">
                            ${dayNumber}
                        </span>
                        ${isToday ? '<div class="mt-1 size-1 rounded-full bg-slate-700"></div>' : ''}
                    </div>
                `;
            } else {
                // Giorno selezionabile: <button>
                daysHTML += `
                    <button 
                        type="button"
                        class="${allClasses}"
                        data-day-id="${id}"
                        aria-pressed="${isSelected ? 'true' : 'false'}"
                        ${isToday ? 'aria-current="date"' : ''}
                    >
                        <span class="text-[9px] font-medium uppercase mb-1 ${weekdayColor}">
                            ${weekday}
                        </span>
                        <span class="text-base font-bold ${numberColor}">
                            ${dayNumber}
                        </span>
                        ${isToday && !isSelected ? '<div class="mt-1 size-1 rounded-full bg-primary"></div>' : ''}
                        ${isToday && isSelected ? '<div class="mt-1 size-1 rounded-full bg-white"></div>' : ''}
                    </button>
                `;
            }
        });

        daysHTML += '</div></div>';

        // Monta il componente nel container
        this.refs.schedulerSection.innerHTML = headerHTML + daysHTML;

        console.log('[Home] Scheduler rendered with', weekDays.length, 'days');
    },

    /**
     * Renderizza la Order Preview Card basandosi su homeState.ordersPreview.
     * 
     * RESPONSABILITÀ:
     * - Legge SOLO da homeState.ordersPreview (mai da DOM)
     * - Costruisce l'HTML del componente order-preview-card
     * - Applica stili e contenuti in base alla variant
     * 
     * COSA NON FA:
     * - NON fa fetch
     * - NON modifica homeState
     * - NON calcola la variant (già computata)
     * - NON seleziona l'ordine più rilevante (già fatto)
     * 
     * SUPPORTA CHIAMATE MULTIPLE:
     * - Può essere chiamata N volte per aggiornare il render
     * - Sostituisce sempre il contenuto del container
     */
    renderOrderPreview() {
        if (!this.refs.orderPreviewContainer) {
            console.warn('[Home] Cannot render order preview: container not found');
            return;
        }

        const { variant, ordersCount, selectedOrder } = homeState.ordersPreview;

        // Configurazione icone (stesse di config/ui.php)
        const icons = {
            receipt: 'receipt_long',
            chevron_right: 'chevron_right',
            login: 'login',
            add_circle: 'add_circle',
        };

        // Configurazione labels (stesse di config/ui.php)
        const labels = {
            login_cta: 'Log in to book and track your orders',
            no_orders: 'No orders yet',
            book_sandwich: 'Book sandwich',
            aria_login: 'Go to login',
            aria_empty: 'Create a new order',
            aria_orders: 'View your orders',
        };

        // Configurazione colori per stato
        const statusColors = {
            pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' },
            confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500' },
            ready: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
            picked_up: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
            rejected: { bg: 'bg-rose-500/10', text: 'text-rose-500', dot: 'bg-rose-500' },
        };

        // Determina URL destinazione
        const getHref = () => {
            switch (variant) {
                case 'login-cta': return '/login';
                case 'empty': return '/orders'; // TODO: sostituire con route creazione ordine
                case 'single':
                case 'multi':
                default: return '/orders';
            }
        };

        // Determina aria-label
        const getAriaLabel = () => {
            switch (variant) {
                case 'login-cta': return labels.aria_login;
                case 'empty': return labels.aria_empty;
                default: return labels.aria_orders;
            }
        };

        let componentHTML = '';
        const href = getHref();
        const ariaLabel = getAriaLabel();

        // =====================================================
        // VARIANT: LOGIN-CTA
        // =====================================================
        if (variant === 'login-cta') {
            componentHTML = `
                <a 
                    href="${href}"
                    class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl"
                    aria-label="${ariaLabel}"
                >
                    <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
                        <div class="flex items-center gap-3">
                            <div class="size-11 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span class="material-symbols-outlined text-primary" aria-hidden="true">
                                    ${icons.login}
                                </span>
                            </div>
                            <div>
                                <p class="text-white text-sm font-bold">${labels.login_cta}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="h-8 w-px bg-border-dark/50"></div>
                            <span class="material-symbols-outlined text-slate-400" aria-hidden="true">
                                ${icons.chevron_right}
                            </span>
                        </div>
                    </div>
                </a>
            `;
        }
        // =====================================================
        // VARIANT: EMPTY
        // =====================================================
        else if (variant === 'empty') {
            componentHTML = `
                <a 
                    href="${href}"
                    class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl"
                    aria-label="${ariaLabel}"
                >
                    <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
                        <div class="flex items-center gap-3">
                            <div class="size-11 rounded-lg bg-slate-500/10 flex items-center justify-center">
                                <span class="material-symbols-outlined text-slate-400" aria-hidden="true">
                                    ${icons.add_circle}
                                </span>
                            </div>
                            <div>
                                <p class="text-slate-400 text-sm font-medium">${labels.no_orders}</p>
                                <p class="text-primary text-xs font-bold mt-0.5">${labels.book_sandwich}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="h-8 w-px bg-border-dark/50"></div>
                            <span class="material-symbols-outlined text-slate-400" aria-hidden="true">
                                ${icons.chevron_right}
                            </span>
                        </div>
                    </div>
                </a>
            `;
        }
        // =====================================================
        // VARIANT: SINGLE
        // =====================================================
        else if (variant === 'single' && selectedOrder) {
            const colors = statusColors[selectedOrder.status] || statusColors.pending;
            const pulseClass = selectedOrder.status === 'ready' ? 'animate-pulse' : '';

            componentHTML = `
                <a 
                    href="${href}"
                    class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl"
                    aria-label="${ariaLabel}"
                >
                    <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
                        <div class="flex items-center gap-3">
                            <div class="relative">
                                <div class="size-11 rounded-lg ${colors.bg} flex items-center justify-center">
                                    <span class="material-symbols-outlined ${colors.text}" aria-hidden="true">
                                        ${icons.receipt}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p class="text-white text-sm font-bold">#${selectedOrder.id}</p>
                                <div class="flex items-center gap-1.5 mt-0.5">
                                    <span class="size-1.5 rounded-full ${colors.dot} ${pulseClass}" aria-hidden="true"></span>
                                    <p class="${colors.text} text-[10px] font-bold uppercase tracking-wider">
                                        ${selectedOrder.statusLabel}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="h-8 w-px bg-border-dark/50"></div>
                            <span class="material-symbols-outlined text-slate-400" aria-hidden="true">
                                ${icons.chevron_right}
                            </span>
                        </div>
                    </div>
                </a>
            `;
        }
        // =====================================================
        // VARIANT: MULTI
        // =====================================================
        else if (variant === 'multi' && selectedOrder) {
            const colors = statusColors[selectedOrder.status] || statusColors.pending;
            const pulseClass = selectedOrder.status === 'ready' ? 'animate-pulse' : '';

            componentHTML = `
                <a 
                    href="${href}"
                    class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark rounded-xl"
                    aria-label="${ariaLabel}"
                >
                    <!-- Testo nascosto per screen reader con conteggio ordini -->
                    <span class="sr-only">You have ${ordersCount} orders</span>
                    
                    <!-- Layer 1: shadow card più lontana -->
                    <div class="absolute inset-0 top-4 mx-4 h-full rounded-xl border border-border-dark/30 bg-surface-dark/40 scale-[0.92] opacity-40 z-0" aria-hidden="true"></div>
                    
                    <!-- Layer 2: shadow card intermedia -->
                    <div class="absolute inset-0 top-2 mx-2 h-full rounded-xl border border-border-dark/60 bg-surface-dark/80 scale-[0.96] opacity-70 z-10" aria-hidden="true"></div>
                    
                    <!-- Card principale -->
                    <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
                        <div class="flex items-center gap-3">
                            <div class="relative">
                                <div class="size-11 rounded-lg ${colors.bg} flex items-center justify-center">
                                    <span class="material-symbols-outlined ${colors.text}" aria-hidden="true">
                                        ${icons.receipt}
                                    </span>
                                </div>
                                <!-- Badge numerico ordini -->
                                <div 
                                    class="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-surface-dark shadow-lg min-w-[20px] text-center"
                                    aria-hidden="true"
                                >
                                    ${ordersCount}
                                </div>
                            </div>
                            <div>
                                <p class="text-white text-sm font-bold">#${selectedOrder.id}</p>
                                <div class="flex items-center gap-1.5 mt-0.5">
                                    <span class="size-1.5 rounded-full ${colors.dot} ${pulseClass}" aria-hidden="true"></span>
                                    <p class="${colors.text} text-[10px] font-bold uppercase tracking-wider">
                                        ${selectedOrder.statusLabel}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="h-8 w-px bg-border-dark/50"></div>
                            <span class="material-symbols-outlined text-slate-400" aria-hidden="true">
                                ${icons.chevron_right}
                            </span>
                        </div>
                    </div>
                </a>
            `;
        }

        // Monta il componente nel container
        this.refs.orderPreviewContainer.innerHTML = componentHTML;

        // Aggiorna href del bottone "View All" in base a isAuthenticated
        if (this.refs.viewAllButton) {
            this.refs.viewAllButton.href = homeState.user.authenticated ? '/orders' : '/login';
        }

        console.log('[Home] Order preview rendered:', variant, ordersCount ? `(${ordersCount} orders)` : '');
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
     * Gestisce selezione di un giorno nello scheduler.
     * 
     * LOGICA:
     * - Se giorno già selected → NESSUNA AZIONE (idempotenza)
     * - Altrimenti:
     *   1. Aggiorna homeState.selectedDayId
     *   2. Aggiorna isSelected nei weekDays
     *   3. Re-render scheduler
     *   4. TODO: Fetch time slots per il giorno
     * 
     * @param {string} dayId - ID giorno cliccato (YYYY-MM-DD)
     */
    handleDaySelection(dayId) {
        // Check idempotenza: giorno già selezionato
        if (homeState.selectedDayId === dayId) {
            console.log('[Home] Day already selected, no action:', dayId);
            return;
        }

        console.log('[Home] Day selection changed:', homeState.selectedDayId, '->', dayId);

        // Aggiorna selectedDayId
        homeState.selectedDayId = dayId;

        // Aggiorna isSelected nei weekDays
        homeState.weekDays = homeState.weekDays.map(day => ({
            ...day,
            isSelected: day.id === dayId,
        }));

        // Re-render scheduler
        homeView.renderScheduler({
            monthLabel: homeState.monthLabel,
            weekDays: homeState.weekDays,
        });

        // TODO: Fetch time slots per il giorno selezionato
        // fetchTimeSlotsForDay(dayId);
    },

    /**
     * Event delegation handler.
     * Delega eventi in base a data-action e data-day-id.
     * 
     * @param {Event} event - Click event
     */
    handleAction(event) {
        // Check per data-day-id (scheduler)
        const dayButton = event.target.closest('[data-day-id]');
        if (dayButton) {
            const dayId = dayButton.dataset.dayId;
            this.handleDaySelection(dayId);
            return;
        }

        // Check per data-action (sidebar, ecc.)
        const actionTarget = event.target.closest('[data-action]');
        if (!actionTarget) return;

        const action = actionTarget.dataset.action;

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

// =============================================================================
// ORDER PREVIEW LOGIC FUNCTIONS
// =============================================================================

/**
 * Seleziona l'ordine più rilevante da un array di ordini.
 * 
 * PRIORITÀ STATI (dal più importante al meno importante):
 * 1. rejected - L'utente deve accorgersene subito
 * 2. ready - L'ordine è pronto per il ritiro
 * 3. confirmed - L'ordine è confermato, in preparazione
 * 4. pending - In attesa di conferma
 * 5. picked_up - Già ritirato (meno urgente)
 * 
 * TIE-BREAK: se più ordini hanno lo stesso stato, 
 * viene scelto il primo nell'array (indice minore).
 * 
 * @param {Array} ordersArray - Array di ordini con id, status, etc.
 * @returns {Object|null} - L'ordine più rilevante o null se array vuoto
 */
function selectMostRelevantOrder(ordersArray) {
    if (!ordersArray || ordersArray.length === 0) {
        return null;
    }

    // Priorità stati: indice più basso = priorità più alta
    const statusPriority = {
        'rejected': 0,
        'ready': 1,
        'confirmed': 2,
        'pending': 3,
        'picked_up': 4,
    };

    // Trova l'ordine con priorità più alta
    let mostRelevant = ordersArray[0];
    let highestPriority = statusPriority[mostRelevant.status] ?? 999;

    for (let i = 1; i < ordersArray.length; i++) {
        const order = ordersArray[i];
        const priority = statusPriority[order.status] ?? 999;

        // Se questo ordine ha priorità più alta (numero più basso), lo selezioniamo
        // In caso di parità, manteniamo il primo trovato (tie-break)
        if (priority < highestPriority) {
            mostRelevant = order;
            highestPriority = priority;
        }
    }

    return mostRelevant;
}

/**
 * Costruisce la statusLabel formattata per un ordine.
 * 
 * @param {string} status - Stato dell'ordine
 * @param {string|null} pickupTime - Orario di ritiro (opzionale, formato HH:MM)
 * @returns {string} - Label formattata (es. "READY AT 12:45 PM")
 */
function buildStatusLabel(status, pickupTime = null) {
    // Label base per ogni stato
    const baseLabels = {
        'pending': 'PENDING',
        'confirmed': 'CONFIRMED',
        'ready': 'READY',
        'picked_up': 'PICKED UP',
        'rejected': 'REJECTED',
    };

    const baseLabel = baseLabels[status] || status.toUpperCase();

    // Se ready e abbiamo un pickup time, aggiungiamolo
    if (status === 'ready' && pickupTime) {
        return `READY AT ${pickupTime}`;
    }

    // Se confirmed e abbiamo un pickup time, mostriamo l'orario previsto
    if (status === 'confirmed' && pickupTime) {
        return `PICKUP AT ${pickupTime}`;
    }

    return baseLabel;
}

/**
 * Computa lo stato completo di ordersPreview basandosi sui dati raw.
 * 
 * LOGICA DI DECISIONE VARIANT:
 * - Se !isAuthenticated → 'login-cta'
 * - Se 0 ordini → 'empty'
 * - Se 1 ordine → 'single'
 * - Se >=2 ordini → 'multi'
 * 
 * @param {Array} rawOrders - Array di ordini dal backend
 * @param {boolean} isAuthenticated - Se l'utente è autenticato
 * @returns {Object} - Oggetto da assegnare a homeState.ordersPreview
 */
function computeOrdersPreviewState(rawOrders, isAuthenticated) {
    // CASO A: Utente non loggato
    if (!isAuthenticated) {
        return {
            variant: 'login-cta',
            ordersCount: 0,
            selectedOrder: null,
        };
    }

    const orders = rawOrders || [];
    const ordersCount = orders.length;

    // CASO B: Utente loggato, 0 ordini
    if (ordersCount === 0) {
        return {
            variant: 'empty',
            ordersCount: 0,
            selectedOrder: null,
        };
    }

    // CASO C: Utente loggato, 1 ordine
    if (ordersCount === 1) {
        const order = orders[0];
        return {
            variant: 'single',
            ordersCount: 1,
            selectedOrder: {
                id: order.id,
                status: order.status,
                statusLabel: buildStatusLabel(order.status, order.pickup_time || null),
            },
        };
    }

    // CASO D: Utente loggato, 2+ ordini
    const mostRelevant = selectMostRelevantOrder(orders);
    return {
        variant: 'multi',
        ordersCount: ordersCount,
        selectedOrder: {
            id: mostRelevant.id,
            status: mostRelevant.status,
            statusLabel: buildStatusLabel(mostRelevant.status, mostRelevant.pickup_time || null),
        },
    };
}

/**
 * Inizializza la sezione Order Preview.
 * 
 * WORKFLOW:
 * 1. Legge dati ordini iniettati dal backend (JSON inline)
 * 2. Computa lo stato via computeOrdersPreviewState
 * 3. Aggiorna homeState.ordersPreview
 * 4. Chiama renderOrderPreview
 * 
 * @param {Object} ordersData - Dati dal backend { orders: [...] }
 */
function initOrderPreview(ordersData) {
    const orders = ordersData?.orders || [];
    const isAuthenticated = homeState.user.authenticated;

    // Computa lo stato
    homeState.ordersPreview = computeOrdersPreviewState(orders, isAuthenticated);

    // Render
    homeView.renderOrderPreview();

    console.log('[Home] Order preview initialized:', homeState.ordersPreview.variant);
}

// =============================================================================
// PAGE INITIALIZATION
// =============================================================================

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

    // 4. Leggi dati week scheduler dal backend (passato via Blade)
    // Cerca elemento con data-week-days (JSON inline)
    const weekDaysElement = document.querySelector('[data-week-days]');
    if (weekDaysElement) {
        try {
            const weekData = JSON.parse(weekDaysElement.textContent);
            homeState.selectedDayId = weekData.selectedDayId;
            homeState.monthLabel = weekData.monthLabel;
            homeState.weekDays = weekData.days;
            console.log('[Home] Week days loaded:', homeState.weekDays.length, 'days');
        } catch (error) {
            console.error('[Home] Failed to parse week days:', error);
        }
    }

    // 5. Render iniziale
    homeView.renderSidebar(homeState.sidebarOpen);
    homeView.renderTruckStatus(homeState.todayService);
    homeView.renderScheduler({
        monthLabel: homeState.monthLabel,
        weekDays: homeState.weekDays,
    });

    // 6. Leggi dati orders preview dal backend (passato via Blade)
    // Cerca elemento con data-orders-preview (JSON inline)
    const ordersPreviewElement = document.querySelector('[data-orders-preview]');
    if (ordersPreviewElement) {
        try {
            const ordersData = JSON.parse(ordersPreviewElement.textContent);
            initOrderPreview(ordersData);
        } catch (error) {
            console.error('[Home] Failed to parse orders preview:', error);
            // Fallback: inizializza con array vuoto
            initOrderPreview({ orders: [] });
        }
    } else {
        // Nessun dato ordini: inizializza comunque (mostrerà login-cta o empty)
        initOrderPreview({ orders: [] });
    }

    // 7. Event delegation su document
    // Tutti i click passano per handleAction
    // Gestisce: data-action (sidebar), data-day-id (scheduler)
    document.addEventListener('click', (event) => {
        homeHandlers.handleAction(event);
    });

    console.log('[Home] Initialized successfully');
}
