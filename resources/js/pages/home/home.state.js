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
     * Time Slots state
     * 
     * PRINCIPIO FONDAMENTALE:
     * I time slots mostrati DEVONO SEMPRE corrispondere
     * al giorno selezionato (selectedDayId) nello scheduler.
     * 
     * selectedDate è l'UNICA fonte di verità per determinare
     * quali time slot mostrare.
     * 
     * - selectedDate: string|null - data in formato YYYY-MM-DD
     * - timeSlots: Array<Object> - slot del selectedDate
     *   {
     *     id: string|number,
     *     time: string (es. "12:00"),
     *     available: number (posti disponibili),
     *     isDisabled: boolean,
     *     href: string (URL prenotazione)
     *   }
     * - loading: boolean - stato caricamento time slots
     * - error: string|null - errore durante fetch
     */
    selectedDate: null,
    timeSlots: [],
    timeSlotsLoading: false,
    timeSlotsError: null,

    /**
     * Polling state
     * - pollingEnabled: boolean - se il polling è attivo
     * - pollingTimer: number|null - ID del timer setInterval
     * - lastPollingUpdate: number|null - timestamp ultimo polling
     */
    pollingEnabled: false,
    pollingTimer: null,
    lastPollingUpdate: null,

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
 * IMPORTANTE: Mantiene la sincronizzazione tra selectedDayId (scheduler)
 * e selectedDate (time slots) secondo le specifiche.
 * 
 * @param {string} dayId - ID giorno nel formato YYYY-MM-DD
 */
export function mutateSelectedDay(dayId) {
    homeState.selectedDayId = dayId;
    homeState.selectedDate = dayId;  // Sincronizzazione scheduler ↔ time slots
    
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
    console.log('[mutateOrdersPreview] BEFORE mutation:', JSON.parse(JSON.stringify(homeState.ordersPreview)));
    console.log('[mutateOrdersPreview] Applying data:', ordersData);
    homeState.ordersPreview = { ...homeState.ordersPreview, ...ordersData };
    console.log('[mutateOrdersPreview] AFTER mutation:', JSON.parse(JSON.stringify(homeState.ordersPreview)));
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
 * Aggiorna time slots state
 * 
 * IMPORTANTE: Questa funzione aggiorna SOLO i time slots,
 * NON modifica selectedDate (che viene gestito da mutateSelectedDay)
 * 
 * @param {Object} timeSlotsData - { timeSlots?, loading?, error? }
 */
export function mutateTimeSlots(timeSlotsData) {
    if (timeSlotsData.timeSlots !== undefined) {
        homeState.timeSlots = timeSlotsData.timeSlots;
    }
    if (timeSlotsData.loading !== undefined) {
        homeState.timeSlotsLoading = Boolean(timeSlotsData.loading);
    }
    if (timeSlotsData.error !== undefined) {
        homeState.timeSlotsError = timeSlotsData.error;
    }
}

/**
 * Aggiorna stato del polling
 * 
 * @param {Object} pollingData - { enabled?, timer?, lastUpdate? }
 */
export function mutatePolling(pollingData) {
    if (pollingData.enabled !== undefined) {
        homeState.pollingEnabled = Boolean(pollingData.enabled);
    }
    if (pollingData.timer !== undefined) {
        homeState.pollingTimer = pollingData.timer;
    }
    if (pollingData.lastUpdate !== undefined) {
        homeState.lastPollingUpdate = pollingData.lastUpdate;
    }
}

/**
 * Inizializza selectedDate con TODAY o primo giorno attivo futuro
 * secondo le regole delle specifiche dei time slots.
 * 
 * LOGICA:
 * 1. Determina TODAY lato frontend
 * 2. Se TODAY è selezionabile → selectedDate = TODAY
 * 3. Altrimenti → selectedDate = primo giorno FUTURO selezionabile
 * 
 * @returns {string|null} - selectedDate determinato o null se nessun giorno valido
 */
export function initializeSelectedDate() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Trova TODAY nei weekDays
    const todayData = homeState.weekDays.find(day => day.id === today);
    
    if (todayData && !todayData.isDisabled && todayData.isActive) {
        // TODAY è selezionabile
        homeState.selectedDate = today;
        return today;
    }
    
    // Trova primo giorno futuro selezionabile
    const futureDays = homeState.weekDays.filter(day => {
        return day.id >= today && !day.isDisabled && day.isActive;
    }).sort((a, b) => a.id.localeCompare(b.id));
    
    const firstActiveDay = futureDays[0];
    if (firstActiveDay) {
        homeState.selectedDate = firstActiveDay.id;
        return firstActiveDay.id;
    }
    
    // Nessun giorno attivo trovato
    homeState.selectedDate = null;
    return null;
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
    mutateTimeSlots,
    mutatePolling,
    initializeSelectedDate,
};
