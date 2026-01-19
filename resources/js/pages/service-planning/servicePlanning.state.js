/**
 * SERVICE PLANNING STATE - Single Source of Truth
 * 
 * RESPONSABILITÀ:
 * - Definisce struttura servicePlanningState (SOLO dati, MAI riferimenti DOM)
 * - Fornisce helper per mutation sicure dello stato
 * 
 * ARCHITETTURA:
 * - Centralizza lo stato della pagina Service Planning
 * - Esportato e importato da index.js, hydration.js, actions.js
 * - I componenti NON importano questo modulo (ricevono props)
 */

/**
 * STATO GLOBALE PAGINA SERVICE PLANNING (SSOT)
 * 
 * Contiene SOLO dati primitivi e serializzabili.
 * MAI riferimenti DOM, funzioni, o oggetti complessi.
 */
export const servicePlanningState = {
    // ========================================
    // USER STATE
    // ========================================
    user: {
        authenticated: false,
        name: null,
        nickname: null,
        role: null,
    },

    // ========================================
    // CONFIG DEFAULTS (from server)
    // ========================================
    configDefaults: {
        maxOrdersPerSlot: 10,
        maxPendingTime: 30,
        location: '',
        dayStartTime: '12:00',
        dayEndTime: '20:00',
        timeSlotDuration: 15,
    },

    // ========================================
    // WEEK STATE
    // ========================================
    /**
     * Inizio settimana selezionata (YYYY-MM-DD, sempre lunedì)
     */
    weekStart: null,

    /**
     * Fine settimana selezionata (YYYY-MM-DD, sempre domenica)
     */
    weekEnd: null,

    /**
     * La settimana è modificabile?
     * false se è una settimana passata
     * true se è settimana corrente (con restrizioni sui giorni) o futura
     */
    isWeekEditable: false,

    // ========================================
    // GLOBAL CONSTRAINTS (current values)
    // ========================================
    globalConstraints: {
        maxOrdersPerSlot: 10,
        maxPendingTime: 30,
        location: '',
    },

    // ========================================
    // ORIGINAL VALUES (for dirty detection)
    // ========================================
    originalGlobalConstraints: {
        maxOrdersPerSlot: 10,
        maxPendingTime: 30,
        location: '',
    },

    // ========================================
    // DAYS STATE (7 giorni della settimana)
    // ========================================
    /**
     * Array di 7 giorni della settimana selezionata
     * Ogni giorno ha:
     * - date: string (YYYY-MM-DD)
     * - dayOfWeek: number (0=Mon, 6=Sun)
     * - dayName: string (Monday, Tuesday, ...)
     * - dayNameShort: string (Mon, Tue, ...)
     * - dayNumber: number (1-31)
     * - isActive: boolean (toggle ON/OFF)
     * - startTime: string (HH:MM)
     * - endTime: string (HH:MM)
     * - isEditable: boolean (può essere modificato?)
     * - hasOrders: boolean (ha ordini esistenti?)
     * - ordersCount: number (quanti ordini)
     */
    days: [],

    /**
     * Stato originale dei giorni (per dirty detection)
     */
    originalDays: [],

    // ========================================
    // UI STATE
    // ========================================
    /**
     * Loading state
     */
    isLoading: true,

    /**
     * Saving state
     */
    isSaving: false,

    /**
     * Error message
     */
    error: null,

    /**
     * Dirty state - qualcosa è cambiato?
     */
    isDirty: false,
};

// ============================================================================
// MUTATION HELPERS
// ============================================================================

/**
 * Aggiorna user state
 */
export function mutateUser(user) {
    Object.assign(servicePlanningState.user, user);
}

/**
 * Aggiorna config defaults
 */
export function mutateConfigDefaults(defaults) {
    Object.assign(servicePlanningState.configDefaults, defaults);
}

/**
 * Aggiorna settimana selezionata
 */
export function mutateWeek(weekStart, weekEnd, isEditable) {
    servicePlanningState.weekStart = weekStart;
    servicePlanningState.weekEnd = weekEnd;
    servicePlanningState.isWeekEditable = isEditable;
}

/**
 * Aggiorna global constraints
 */
export function mutateGlobalConstraints(constraints) {
    Object.assign(servicePlanningState.globalConstraints, constraints);
    checkDirtyState();
}

/**
 * Set original global constraints (per dirty detection)
 */
export function setOriginalGlobalConstraints(constraints) {
    servicePlanningState.originalGlobalConstraints = { ...constraints };
}

/**
 * Aggiorna un singolo global constraint
 */
export function mutateGlobalConstraint(key, value) {
    servicePlanningState.globalConstraints[key] = value;
    checkDirtyState();
}

/**
 * Aggiorna stato giorni
 */
export function mutateDays(days) {
    servicePlanningState.days = days;
    checkDirtyState();
}

/**
 * Set original days (per dirty detection)
 */
export function setOriginalDays(days) {
    servicePlanningState.originalDays = JSON.parse(JSON.stringify(days));
}

/**
 * Aggiorna un singolo giorno
 */
export function mutateDay(date, updates) {
    const day = servicePlanningState.days.find(d => d.date === date);
    if (day) {
        Object.assign(day, updates);
        checkDirtyState();
    }
}

/**
 * Toggle giorno attivo/inattivo
 */
export function toggleDayActive(date) {
    const day = servicePlanningState.days.find(d => d.date === date);
    if (day && day.isEditable) {
        day.isActive = !day.isActive;
        checkDirtyState();
    }
}

/**
 * Aggiorna orario di un giorno
 */
export function mutateDayTime(date, field, value) {
    const day = servicePlanningState.days.find(d => d.date === date);
    if (day && day.isEditable) {
        day[field] = value;
        // Normalizza orari
        normalizeDayTimes(day);
        checkDirtyState();
    }
}

/**
 * Normalizza orari di un giorno secondo le regole definite
 */
function normalizeDayTimes(day) {
    const duration = servicePlanningState.configDefaults.timeSlotDuration;
    
    // Round start time
    day.startTime = roundTimeToSlotDuration(day.startTime, duration);
    // Round end time
    day.endTime = roundTimeToSlotDuration(day.endTime, duration);
    
    // Ensure start < end
    if (timeToMinutes(day.startTime) >= timeToMinutes(day.endTime)) {
        // If start >= end, set end = start + duration
        day.endTime = minutesToTime(timeToMinutes(day.startTime) + duration);
    }
}

/**
 * Round time to nearest slot duration
 */
function roundTimeToSlotDuration(time, duration) {
    const minutes = timeToMinutes(time);
    const rounded = Math.round(minutes / duration) * duration;
    // Clamp to valid range (00:00 - 23:45 for 15min slots)
    const maxMinutes = 24 * 60 - duration;
    const clamped = Math.min(Math.max(0, rounded), maxMinutes);
    return minutesToTime(clamped);
}

/**
 * Convert HH:MM to minutes
 */
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Convert minutes to HH:MM
 */
function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Aggiorna loading state
 */
export function mutateLoading(isLoading) {
    servicePlanningState.isLoading = isLoading;
}

/**
 * Aggiorna saving state
 */
export function mutateSaving(isSaving) {
    servicePlanningState.isSaving = isSaving;
}

/**
 * Aggiorna error state
 */
export function mutateError(error) {
    servicePlanningState.error = error;
}

/**
 * Check and update dirty state
 */
export function checkDirtyState() {
    const state = servicePlanningState;
    
    // Check global constraints
    const constraintsDirty = 
        state.globalConstraints.maxOrdersPerSlot !== state.originalGlobalConstraints.maxOrdersPerSlot ||
        state.globalConstraints.maxPendingTime !== state.originalGlobalConstraints.maxPendingTime ||
        state.globalConstraints.location !== state.originalGlobalConstraints.location;
    
    // Check days
    let daysDirty = false;
    for (let i = 0; i < state.days.length; i++) {
        const current = state.days[i];
        const original = state.originalDays[i];
        if (!original) continue;
        
        if (current.isActive !== original.isActive ||
            current.startTime !== original.startTime ||
            current.endTime !== original.endTime) {
            daysDirty = true;
            break;
        }
    }
    
    state.isDirty = constraintsDirty || daysDirty;
}

/**
 * Reset dirty state after save
 */
export function resetDirtyState() {
    const state = servicePlanningState;
    
    // Copy current to original
    state.originalGlobalConstraints = { ...state.globalConstraints };
    state.originalDays = JSON.parse(JSON.stringify(state.days));
    state.isDirty = false;
}

// ============================================================================
// DERIVED STATE (COMPUTED)
// ============================================================================

/**
 * Get week label (e.g., "Jan 19 - Jan 25, 2026")
 */
export function getWeekLabel() {
    const state = servicePlanningState;
    if (!state.weekStart || !state.weekEnd) return '';
    
    const start = new Date(state.weekStart);
    const end = new Date(state.weekEnd);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const startMonth = months[start.getMonth()];
    const endMonth = months[end.getMonth()];
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = end.getFullYear();
    
    if (startMonth === endMonth) {
        return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
}

/**
 * Check if can go to previous week
 */
export function canGoPrevWeek() {
    // Sempre possibile andare indietro per visualizzare
    return true;
}

/**
 * Check if can go to next week
 */
export function canGoNextWeek() {
    // Sempre possibile andare avanti
    return true;
}

/**
 * Check if save button should be enabled
 */
export function canSave() {
    const state = servicePlanningState;
    return state.isDirty && state.isWeekEditable && !state.isSaving;
}

export default servicePlanningState;
