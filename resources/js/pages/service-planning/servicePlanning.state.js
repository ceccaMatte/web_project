// Centralized state for service planning

const DEBUG = false;

function debugLog() {}

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

    /**
     * La settimana ha dati persistiti nel DB?
     * Importante per dirty-state: se false, qualsiasi modifica è dirty
     */
    hasPersistedData: false,

    // ========================================
    // GLOBAL CONSTRAINTS (current draft values)
    // ========================================
    globalConstraints: {
        maxOrdersPerSlot: 10,
        maxPendingTime: 30,
        maxIngredientsPerOrder: 6,
        location: '',
    },

    // ========================================
    // DAYS STATE (7 giorni della settimana - draft)
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

    // ========================================
    // INITIAL SNAPSHOT (per dirty detection)
    // ========================================
    /**
     * Snapshot dello stato al momento del caricamento/salvataggio
     * Contiene SOLO i campi salvabili, deep-clonato
     * NON deve mai essere mutato dopo la creazione
     */
    initialSnapshot: null,

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
     * Dirty state - qualcosa è cambiato rispetto allo snapshot?
     * Calcolato confrontando draft con initialSnapshot
     */
    isDirty: false,
};

// ============================================================================
// DEEP CLONE UTILITY
// ============================================================================

/**
 * Deep clone di un oggetto (senza riferimenti condivisi)
 * Usa JSON per semplicità (adatto per dati primitivi)
 */
export function deepClone(obj) {
    if (obj === null || obj === undefined) return obj;
    return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// SNAPSHOT CREATION
// ============================================================================

/**
 * Crea uno snapshot dei campi salvabili
 * Include SOLO i dati che partecipano al dirty-state
 */
export function createSavableSnapshot(state) {
    const today = getTodayString();
    
    // Filtra solo i giorni modificabili (date > oggi)
    const editableDays = state.days
        .filter(day => day.date > today)
        .map(day => ({
            date: day.date,
            isActive: day.isActive,
            startTime: day.startTime,
            endTime: day.endTime,
        }));
    
    return {
        globalConstraints: {
            maxOrdersPerSlot: state.globalConstraints.maxOrdersPerSlot,
            maxPendingTime: state.globalConstraints.maxPendingTime,
            maxIngredientsPerOrder: state.globalConstraints.maxIngredientsPerOrder,
            location: state.globalConstraints.location,
        },
        days: editableDays,
    };
}

/**
 * Salva l'initialSnapshot dallo stato corrente
 * Chiamato dopo hydration o dopo save riuscito
 */
export function saveInitialSnapshot() {
    const snapshot = createSavableSnapshot(servicePlanningState);
    servicePlanningState.initialSnapshot = deepClone(snapshot);
    servicePlanningState.isDirty = false;
    
    debugLog('saveInitialSnapshot', 'Snapshot salvato:', servicePlanningState.initialSnapshot);
}

// ============================================================================
// DIRTY STATE CALCULATION
// ============================================================================

/**
 * Ottieni la data di oggi in formato YYYY-MM-DD
 */
export function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Confronta due oggetti per uguaglianza profonda
 */
function deepEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Calcola se lo stato corrente è "dirty" rispetto allo snapshot
 * 
 * REGOLE:
 * - Se la settimana è passata: dirty = false (non salvabile)
 * - Se non c'è snapshot: dirty = true (prima configurazione)
 * - Altrimenti: confronta campi salvabili
 */
export function computeDirtyState() {
    const state = servicePlanningState;
    const today = getTodayString();
    
    // Se la settimana è passata, non può essere dirty
    if (state.weekEnd && state.weekEnd < today) {
        debugLog('computeDirtyState', 'Settimana passata, dirty=false');
        return false;
    }
    
    // Se non c'è snapshot iniziale, considera dirty se ci sono dati modificabili
    if (!state.initialSnapshot) {
        debugLog('computeDirtyState', 'Nessuno snapshot, dirty=true');
        return true;
    }
    
    // Crea snapshot corrente
    const currentSnapshot = createSavableSnapshot(state);
    
    // Confronta global constraints
    if (!deepEqual(currentSnapshot.globalConstraints, state.initialSnapshot.globalConstraints)) {
        debugLog('computeDirtyState', 'Global constraints diversi, dirty=true', {
            current: currentSnapshot.globalConstraints,
            initial: state.initialSnapshot.globalConstraints
        });
        return true;
    }
    
    // Confronta giorni modificabili
    if (!deepEqual(currentSnapshot.days, state.initialSnapshot.days)) {
        debugLog('computeDirtyState', 'Giorni diversi, dirty=true', {
            current: currentSnapshot.days,
            initial: state.initialSnapshot.days
        });
        return true;
    }
    
    debugLog('computeDirtyState', 'Nessuna differenza, dirty=false');
    return false;
}

/**
 * Ricalcola e aggiorna il dirty state
 */
export function updateDirtyState() {
    servicePlanningState.isDirty = computeDirtyState();
    debugLog('updateDirtyState', 'isDirty =', servicePlanningState.isDirty);
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Convert HH:MM to minutes
 */
export function timeToMinutes(time) {
    if (!time || typeof time !== 'string') return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Convert minutes to HH:MM
 */
export function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Round time to nearest slot duration
 */
export function roundTimeToSlotDuration(time, duration) {
    const minutes = timeToMinutes(time);
    const rounded = Math.round(minutes / duration) * duration;
    // Clamp to valid range (00:00 - 23:45 for 15min slots)
    const maxMinutes = 24 * 60 - duration;
    const clamped = Math.min(Math.max(0, rounded), maxMinutes);
    return minutesToTime(clamped);
}

/**
 * Normalizza orari di un giorno secondo le regole definite nel prompt
 * 
 * REGOLE OBBLIGATORIE:
 * 1) Arrotondamento al multiplo più vicino della durata slot
 * 2) start < stop e start ≠ stop
 * 3) Se start >= stop: stop = start + slot_duration
 * 4) Casi limite:
 *    - stop = 00:00 → start = 00:00, stop = 00:15
 *    - start = 23:45 → start = 23:30, stop = 23:45
 * 
 * @param {string} startTime - Orario inizio (HH:MM)
 * @param {string} endTime - Orario fine (HH:MM)
 * @param {number} slotDuration - Durata slot in minuti
 * @param {string} changedField - Quale campo è stato cambiato ('start' o 'end')
 * @returns {object} - { startTime, endTime } normalizzati
 */
export function normalizeTimes(startTime, endTime, slotDuration, changedField = 'start') {
    debugLog('normalizeTimes', 'Input:', { startTime, endTime, slotDuration, changedField });
    
    // Arrotonda entrambi gli orari
    let startMinutes = timeToMinutes(roundTimeToSlotDuration(startTime, slotDuration));
    let endMinutes = timeToMinutes(roundTimeToSlotDuration(endTime, slotDuration));
    
    const maxMinutes = 24 * 60 - slotDuration; // 23:45 per slot da 15min
    
    // Gestisci caso limite: end = 00:00 (mezzanotte)
    if (endMinutes === 0) {
        // Se stop è 00:00, impostiamo start = 00:00 e stop = slotDuration
        startMinutes = 0;
        endMinutes = slotDuration;
        debugLog('normalizeTimes', 'Caso limite end=00:00');
    }
    // Gestisci caso limite: start = 23:45 (ultimo slot)
    else if (startMinutes >= maxMinutes && changedField === 'start') {
        // Se start è all'ultimo slot possibile
        startMinutes = maxMinutes - slotDuration; // 23:30
        endMinutes = maxMinutes + slotDuration; // 23:45 (o 24:00)
        // Clampa endMinutes al massimo valido
        if (endMinutes > 24 * 60 - slotDuration) {
            endMinutes = 24 * 60 - slotDuration;
            startMinutes = endMinutes - slotDuration;
        }
        debugLog('normalizeTimes', 'Caso limite start=23:45');
    }
    // Regola generale: start deve essere < end
    else if (startMinutes >= endMinutes) {
        if (changedField === 'start') {
            // L'utente ha spostato start dopo end
            // → stop = start + slot_duration
            endMinutes = startMinutes + slotDuration;
            // Clampa al massimo
            if (endMinutes > 24 * 60) {
                endMinutes = 24 * 60 - slotDuration;
                startMinutes = endMinutes - slotDuration;
            }
            debugLog('normalizeTimes', 'Start >= End, aggiusto end');
        } else {
            // L'utente ha spostato end prima di start
            // → start = stop - slot_duration
            startMinutes = endMinutes - slotDuration;
            // Clampa al minimo
            if (startMinutes < 0) {
                startMinutes = 0;
                endMinutes = slotDuration;
            }
            debugLog('normalizeTimes', 'End <= Start, aggiusto start');
        }
    }
    
    const result = {
        startTime: minutesToTime(startMinutes),
        endTime: minutesToTime(endMinutes)
    };
    
    debugLog('normalizeTimes', 'Output:', result);
    return result;
}

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
export function mutateWeek(weekStart, weekEnd, isEditable, hasPersistedData = false) {
    servicePlanningState.weekStart = weekStart;
    servicePlanningState.weekEnd = weekEnd;
    servicePlanningState.isWeekEditable = isEditable;
    servicePlanningState.hasPersistedData = hasPersistedData;
    
    debugLog('mutateWeek', { weekStart, weekEnd, isEditable, hasPersistedData });
}

/**
 * Aggiorna global constraints
 */
export function mutateGlobalConstraints(constraints) {
    Object.assign(servicePlanningState.globalConstraints, constraints);
    debugLog('mutateGlobalConstraints', constraints);
}

/**
 * Aggiorna un singolo global constraint
 */
export function mutateGlobalConstraint(key, value) {
    // Guard: non modificare se settimana non è editabile
    if (!servicePlanningState.isWeekEditable) {
        debugLog('mutateGlobalConstraint', 'BLOCKED - settimana non editabile');
        return false;
    }
    
    servicePlanningState.globalConstraints[key] = value;
    updateDirtyState();
    
    debugLog('mutateGlobalConstraint', { key, value, isDirty: servicePlanningState.isDirty });
    return true;
}

/**
 * Aggiorna stato giorni
 */
export function mutateDays(days) {
    servicePlanningState.days = days;
    debugLog('mutateDays', 'Aggiornati', days.length, 'giorni');
}

/**
 * Aggiorna un singolo giorno
 */
export function mutateDay(date, updates) {
    const day = servicePlanningState.days.find(d => d.date === date);
    if (day) {
        Object.assign(day, updates);
        updateDirtyState();
    }
}

/**
 * Toggle giorno attivo/inattivo
 * 
 * GUARD: non modificare se il giorno non è editabile
 */
export function toggleDayActive(date) {
    const day = servicePlanningState.days.find(d => d.date === date);
    
    if (!day) {
        debugLog('toggleDayActive', 'Giorno non trovato:', date);
        return false;
    }
    
    if (!day.isEditable) {
        debugLog('toggleDayActive', 'BLOCKED - giorno non editabile:', date);
        return false;
    }
    
    day.isActive = !day.isActive;
    updateDirtyState();
    
    debugLog('toggleDayActive', { date, isActive: day.isActive, isDirty: servicePlanningState.isDirty });
    return true;
}

/**
 * Aggiorna orario di un giorno con normalizzazione
 * 
 * GUARD: non modificare se il giorno non è editabile
 * 
 * @param {string} date - Data del giorno (YYYY-MM-DD)
 * @param {string} field - 'startTime' o 'endTime'
 * @param {string} value - Nuovo valore (HH:MM)
 */
export function mutateDayTime(date, field, value) {
    const day = servicePlanningState.days.find(d => d.date === date);
    
    if (!day) {
        debugLog('mutateDayTime', 'Giorno non trovato:', date);
        return false;
    }
    
    if (!day.isEditable) {
        debugLog('mutateDayTime', 'BLOCKED - giorno non editabile:', date);
        return false;
    }
    
    const slotDuration = servicePlanningState.configDefaults.timeSlotDuration;
    const changedField = field === 'startTime' ? 'start' : 'end';
    
    // Applica il nuovo valore temporaneamente
    const tempStart = field === 'startTime' ? value : day.startTime;
    const tempEnd = field === 'endTime' ? value : day.endTime;
    
    // Normalizza gli orari
    const normalized = normalizeTimes(tempStart, tempEnd, slotDuration, changedField);
    
    day.startTime = normalized.startTime;
    day.endTime = normalized.endTime;
    
    updateDirtyState();
    
    debugLog('mutateDayTime', { 
        date, 
        field, 
        input: value, 
        result: normalized,
        isDirty: servicePlanningState.isDirty 
    });
    
    return true;
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
 * Reset dirty state dopo save riuscito
 */
export function resetDirtyState() {
    saveInitialSnapshot();
    debugLog('resetDirtyState', 'Dirty state resettato');
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
 * 
 * REGOLE:
 * - La settimana deve essere editabile (non passata)
 * - Deve esserci almeno una modifica (isDirty = true)
 * - Non deve essere in corso un salvataggio
 */
export function canSave() {
    const state = servicePlanningState;
    const canSaveNow = state.isDirty && state.isWeekEditable && !state.isSaving;
    
    debugLog('canSave', { 
        isDirty: state.isDirty, 
        isWeekEditable: state.isWeekEditable, 
        isSaving: state.isSaving,
        result: canSaveNow 
    });
    
    return canSaveNow;
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Debug: stampa lo stato completo
 */
export function debugPrintState() {
    console.log(servicePlanningState);
}

/**
 * Debug: confronta stato corrente con snapshot
 */
export function debugCompareDraft() {
    const current = createSavableSnapshot(servicePlanningState);
    const initial = servicePlanningState.initialSnapshot;

    console.log({ current, initial, isDirty: servicePlanningState.isDirty });
}

// Esporta le utility di debug globalmente per uso in console
if (typeof window !== 'undefined') {
    window.debugServicePlanningState = {
        printState: debugPrintState,
        compareDraft: debugCompareDraft,
        getState: () => servicePlanningState,
        forceRecalculateDirty: () => {
            updateDirtyState();
            return servicePlanningState.isDirty;
        }
    };
}

export default servicePlanningState;
