/**
 * HOME STATE - Single Source of Truth
 * 
 * RESPONSABILITÀ:
 * - Definisce struttura homeState (SOLO dati, MAI riferimenti DOM)
 * - Fornisce helper per mutation sicure dello stato
 * 
 * ARCHITETTURA:
 * - Centralizza lo stato della pagina Home
 * - Esportato e importato da home.js, home.hydration.js, home.actions.js
 * - I componenti NON importano questo modulo (ricevono props)
 * 
 * UTILIZZO:
 * import { homeState, mutateUser, mutateSidebar } from './home.state.js';
 */

/**
 * STATO GLOBALE PAGINA HOME (SSOT)
 * 
 * Contiene SOLO dati primitivi e serializzabili.
 * MAI riferimenti DOM, funzioni, o oggetti complessi.
 */
export const homeState = {
    /**
     * User state
     * - authenticated: boolean - se l'utente è loggato
     * - enabled: boolean - se l'utente è abilitato (account attivo)
     * - name: string|null - nome visualizzato (es. "Mario")
     */
    user: {
        authenticated: false,
        enabled: false,
        name: null,
    },

    /**
     * Sidebar state
     * - sidebarOpen: boolean - stato apertura sidebar
     */
    sidebarOpen: false,

    /**
     * Today Service state
     * - status: 'active' | 'inactive' - disponibilità servizio oggi
     * - location: string|null - luogo del servizio
     * - startTime: string|null - orario inizio (es. "11:00")
     * - endTime: string|null - orario fine (es. "14:00")
     * - queueTime: number|null - tempo attesa stimato (minuti)
     */
    todayService: {
        status: 'inactive',
        location: null,
        startTime: null,
        endTime: null,
        queueTime: null,
    },

    /**
     * Week Scheduler state
     * - selectedDayId: string|null - ID giorno selezionato (YYYY-MM-DD)
     * - monthLabel: string|null - label mese corrente (es. "January 2026")
     * - weekDays: Array<Object> - 7 giorni con struttura:
     *   {
     *     id: "2026-01-15",
     *     weekday: "WED",
     *     dayNumber: "15",
     *     isToday: boolean,
     *     isActive: boolean,
     *     isDisabled: boolean,
     *     isSelected: boolean
     *   }
     */
    selectedDayId: null,
    monthLabel: null,
    weekDays: [],

    /**
     * Order Preview state
     * 
     * VARIANTI:
     * - 'login-cta': utente non loggato
     * - 'empty': utente loggato, nessun ordine
     * - 'single': utente loggato, 1 ordine
     * - 'multi': utente loggato, 2+ ordini
     * 
     * STRUTTURA:
     * - variant: string - una delle varianti sopra
     * - ordersCount: number - totale ordini
     * - selectedOrder: Object|null - ordine più rilevante
     *   {
     *     id: string|number,
     *     status: 'pending'|'confirmed'|'ready'|'picked_up'|'rejected',
     *     statusLabel: string - label formattata per UI
     *   }
     */
    ordersPreview: {
        variant: 'login-cta',
        ordersCount: 0,
        selectedOrder: null,
    },

    /**
     * Booking Slots state
     * 
     * Slot prenotabili per domani (o giorno selezionato).
     * 
     * STRUTTURA:
     * - dateLabel: string|null - data formattata (es. "Friday, January 16")
     * - locationLabel: string|null - luogo servizio (es. "Engineering Hub")
     * - slots: Array<Object> - slot disponibili
     *   {
     *     id: number,
     *     timeLabel: string (es. "11:00"),
     *     slotsLeft: number (posti disponibili),
     *     href: string (URL per prenotazione),
     *     isDisabled: boolean
     *   }
     */
    booking: {
        dateLabel: null,
        locationLabel: null,
        slots: [],
    },
};

/**
 * MUTATION HELPERS
 * 
 * Funzioni helper per modificare lo stato in modo sicuro e tracciabile.
 * Evitano mutation diretta e rendono il codice più leggibile.
 */

/**
 * Aggiorna user state
 * 
 * @param {Object} userData - Partial<homeState.user>
 */
export function mutateUser(userData) {
    homeState.user = { ...homeState.user, ...userData };
}

/**
 * Aggiorna stato sidebar
 * 
 * @param {boolean} isOpen
 */
export function mutateSidebar(isOpen) {
    homeState.sidebarOpen = Boolean(isOpen);
}

/**
 * Aggiorna today service state
 * 
 * @param {Object} serviceData - Partial<homeState.todayService>
 */
export function mutateTodayService(serviceData) {
    homeState.todayService = { ...homeState.todayService, ...serviceData };
}

/**
 * Aggiorna scheduler state
 * 
 * @param {Object} schedulerData - { selectedDayId?, monthLabel?, weekDays? }
 */
export function mutateScheduler(schedulerData) {
    if (schedulerData.selectedDayId !== undefined) {
        homeState.selectedDayId = schedulerData.selectedDayId;
    }
    if (schedulerData.monthLabel !== undefined) {
        homeState.monthLabel = schedulerData.monthLabel;
    }
    if (schedulerData.weekDays !== undefined) {
        homeState.weekDays = schedulerData.weekDays;
    }
}

/**
 * Aggiorna giorno selezionato e proprietà isSelected nei weekDays
 * 
 * @param {string} dayId - ID giorno nel formato YYYY-MM-DD
 */
export function mutateSelectedDay(dayId) {
    homeState.selectedDayId = dayId;
    
    // Aggiorna isSelected nei weekDays
    homeState.weekDays = homeState.weekDays.map(day => ({
        ...day,
        isSelected: day.id === dayId,
    }));
}

/**
 * Aggiorna orders preview state
 * 
 * @param {Object} ordersData - Partial<homeState.ordersPreview>
 */
export function mutateOrdersPreview(ordersData) {
    homeState.ordersPreview = { ...homeState.ordersPreview, ...ordersData };
}

/**
 * Aggiorna booking slots state
 * 
 * @param {Object} bookingData - Partial<homeState.booking>
 */
export function mutateBooking(bookingData) {
    homeState.booking = { ...homeState.booking, ...bookingData };
}

/**
 * Export default per import aggregato
 */
export default {
    homeState,
    mutateUser,
    mutateSidebar,
    mutateTodayService,
    mutateScheduler,
    mutateSelectedDay,
    mutateOrdersPreview,
    mutateBooking,
};
