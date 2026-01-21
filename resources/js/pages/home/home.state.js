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

    // Week scheduler data
    selectedDayId: null,
    monthLabel: null,
    weekDays: [],

    // Time slots; selectedDate is the source of truth for displayed slots
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

    // Orders preview state
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

// Mutation helpers

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
