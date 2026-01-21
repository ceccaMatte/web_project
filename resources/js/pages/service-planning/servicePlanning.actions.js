// Actions for service planning page

import { servicePlanningState, mutateWeek, mutateGlobalConstraint, mutateGlobalConstraints, 
         toggleDayActive, mutateDayTime, mutateLoading, mutateSaving, mutateError,
         mutateDays, resetDirtyState, saveInitialSnapshot, updateDirtyState,
         normalizeTimes, getTodayString } from './servicePlanning.state.js';
import { fetchWeekData, saveWeekConfiguration } from './servicePlanning.api.js';
import { renderServicePlanningPage } from './servicePlanning.render.js';

const DEBUG = false;

function debugLog() {}

/**
 * Return localized day name for a date string (it-IT, lowercase)
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string}
 */
function getDayName(dateStr) {
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('it-IT', { weekday: 'long' });
    } catch (e) {
        debugLog('getDayName', 'Invalid date', dateStr);
        return '';
    }
}

// ============================================================================
// WEEK NAVIGATION
// ============================================================================

/**
 * Naviga alla settimana precedente
 */
export async function goToPrevWeek() {
    debugLog('goToPrevWeek', 'Navigazione settimana precedente');
    
    const currentStart = new Date(servicePlanningState.weekStart);
    currentStart.setDate(currentStart.getDate() - 7);
    
    const newWeekStart = formatDate(currentStart);
    await loadWeekData(newWeekStart);
}

/**
 * Naviga alla settimana successiva
 */
export async function goToNextWeek() {
    debugLog('goToNextWeek', 'Navigazione settimana successiva');
    
    const currentStart = new Date(servicePlanningState.weekStart);
    currentStart.setDate(currentStart.getDate() + 7);
    
    const newWeekStart = formatDate(currentStart);
    await loadWeekData(newWeekStart);
}

/**
 * Naviga a una data specifica (calcola la settimana che contiene quella data)
 */
export async function goToDate(dateString) {
    debugLog('goToDate', 'Navigazione a data:', dateString);
    
    const date = new Date(dateString);
    const weekStart = getWeekStart(date);
    
    await loadWeekData(weekStart);
}

/**
 * Carica dati per una settimana
 * 
 * WORKFLOW:
 * 1. Mostra loader
 * 2. Fetch dati da API
 * 3. Aggiorna stato con dati ricevuti
 * 4. Crea snapshot iniziale
 * 5. Render UI
 */
export async function loadWeekData(weekStart) {
    debugLog('loadWeekData', 'Caricamento dati per settimana:', weekStart);
    
    try {
        mutateLoading(true);
        renderServicePlanningPage();
        
        const data = await fetchWeekData(weekStart);
        
        debugLog('loadWeekData', 'Dati ricevuti dal backend:', data);
        
        // Update state with fetched data
        // Il backend restituisce isWeekEditable basato sulla data
        mutateWeek(
            data.weekStart, 
            data.weekEnd, 
            data.isWeekEditable ?? data.isEditable, // Compatibilità naming
            data.hasPersistedData ?? true
        );
        
        mutateGlobalConstraints(data.globalConstraints);
        mutateDays(data.days);
        
        // IMPORTANTE: Crea snapshot DOPO aver caricato tutti i dati
        saveInitialSnapshot();
        
        mutateError(null);
        
        debugLog('loadWeekData', 'Stato dopo caricamento:', {
            weekStart: servicePlanningState.weekStart,
            weekEnd: servicePlanningState.weekEnd,
            isWeekEditable: servicePlanningState.isWeekEditable,
            isDirty: servicePlanningState.isDirty
        });
        
    } catch (error) {
        console.error('[ServicePlanningActions] Failed to load week data:', error);
        mutateError(error.message);
    } finally {
        mutateLoading(false);
        renderServicePlanningPage();
    }
}

// ============================================================================
// GLOBAL CONSTRAINTS ACTIONS
// ============================================================================

/**
 * Incrementa max orders per slot
 * 
 * GUARD: blocca se settimana non editabile
 */
export function incrementMaxOrders() {
    debugLog('incrementMaxOrders', 'Tentativo incremento');
    
    if (!servicePlanningState.isWeekEditable) {
        debugLog('incrementMaxOrders', 'BLOCKED - settimana non editabile');
        return;
    }
    
    const current = servicePlanningState.globalConstraints.maxOrdersPerSlot;
    const serverMax = servicePlanningState.configDefaults.maxMaxOrdersPerSlot || 99;
    const newValue = Math.min(current + 1, serverMax);
    
    if (mutateGlobalConstraint('maxOrdersPerSlot', newValue)) {
        renderServicePlanningPage();
    }
}

/**
 * Decrementa max orders per slot
 * 
 * GUARD: blocca se settimana non editabile o valore già al minimo
 */
export function decrementMaxOrders() {
    debugLog('decrementMaxOrders', 'Tentativo decremento');
    
    if (!servicePlanningState.isWeekEditable) {
        debugLog('decrementMaxOrders', 'BLOCKED - settimana non editabile');
        return;
    }
    
    const current = servicePlanningState.globalConstraints.maxOrdersPerSlot;
    if (current > 1) {
        if (mutateGlobalConstraint('maxOrdersPerSlot', current - 1)) {
            renderServicePlanningPage();
        }
    }
}

/**
 * Incrementa max pending time
 * 
 * GUARD: blocca se settimana non editabile
 */
export function incrementMaxPendingTime() {
    debugLog('incrementMaxPendingTime', 'Tentativo incremento');
    
    if (!servicePlanningState.isWeekEditable) {
        debugLog('incrementMaxPendingTime', 'BLOCKED - settimana non editabile');
        return;
    }
    
    const current = servicePlanningState.globalConstraints.maxPendingTime;
    const newValue = Math.min(current + 5, 120); // Max 120 minuti
    
    if (mutateGlobalConstraint('maxPendingTime', newValue)) {
        renderServicePlanningPage();
    }
}

/**
 * Decrementa max pending time
 * 
 * GUARD: blocca se settimana non editabile o valore già al minimo
 */
export function decrementMaxPendingTime() {
    debugLog('decrementMaxPendingTime', 'Tentativo decremento');
    
    if (!servicePlanningState.isWeekEditable) {
        debugLog('decrementMaxPendingTime', 'BLOCKED - settimana non editabile');
        return;
    }
    
    const current = servicePlanningState.globalConstraints.maxPendingTime;
    if (current > 5) {
        if (mutateGlobalConstraint('maxPendingTime', current - 5)) {
            renderServicePlanningPage();
        }
    }
}

/**
 * Aggiorna location
 * 
 * GUARD: blocca se settimana non editabile
 */
export function updateLocation(value) {
    debugLog('updateLocation', 'Tentativo aggiornamento location:', value);
    
    if (!servicePlanningState.isWeekEditable) {
        debugLog('updateLocation', 'BLOCKED - settimana non editabile');
        return;
    }
    
    if (mutateGlobalConstraint('location', value)) {
        renderServicePlanningPage();
    }
}

// ============================================================================
// DAY ACTIONS
// ============================================================================

/**
 * Verifica se un giorno è modificabile
 * 
 * @param {string} date - Data del giorno (YYYY-MM-DD)
 * @returns {boolean}
 */
export function isDayEditable(date) {
    const day = servicePlanningState.days.find(d => d.date === date);
    return day ? day.isEditable : false;
}

/**
 * Toggle giorno attivo/inattivo
 * 
 * GUARD: blocca se giorno non editabile
 */
export function toggleDay(date) {
    debugLog('toggleDay', 'Tentativo toggle giorno:', date);
    
    if (!isDayEditable(date)) {
        debugLog('toggleDay', 'BLOCKED - giorno non editabile:', date);
        return;
    }
    
    if (toggleDayActive(date)) {
        renderServicePlanningPage();
    }
}

/**
 * Aggiorna orario inizio giorno
 * 
 * GUARD: blocca se giorno non editabile
 * Normalizza automaticamente gli orari
 */
export function updateDayStartTime(date, time) {
    debugLog('updateDayStartTime', 'Tentativo aggiornamento start time:', { date, time });
    
    if (!isDayEditable(date)) {
        debugLog('updateDayStartTime', 'BLOCKED - giorno non editabile:', date);
        return;
    }
    
    if (mutateDayTime(date, 'startTime', time)) {
        renderServicePlanningPage();
    }
}

/**
 * Aggiorna orario fine giorno
 * 
 * GUARD: blocca se giorno non editabile
 * Normalizza automaticamente gli orari
 */
export function updateDayEndTime(date, time) {
    debugLog('updateDayEndTime', 'Tentativo aggiornamento end time:', { date, time });
    
    if (!isDayEditable(date)) {
        debugLog('updateDayEndTime', 'BLOCKED - giorno non editabile:', date);
        return;
    }
    
    if (mutateDayTime(date, 'endTime', time)) {
        renderServicePlanningPage();
    }
}

// ============================================================================
// SAVE ACTION
// ============================================================================

/**
 * Salva tutte le modifiche
 * 
 * WORKFLOW:
 * 1. Verifica che ci siano modifiche da salvare
 * 2. Costruisce payload con solo giorni futuri
 * 3. Invia al backend
 * 4. In caso di successo, aggiorna snapshot
 */
export async function saveChanges() {
    debugLog('saveChanges', 'Tentativo salvataggio');
    
    if (!servicePlanningState.isDirty) {
        debugLog('saveChanges', 'BLOCKED - nessuna modifica da salvare');
        return;
    }
    
    if (!servicePlanningState.isWeekEditable) {
        debugLog('saveChanges', 'BLOCKED - settimana non editabile');
        return;
    }
    
    if (servicePlanningState.isSaving) {
        debugLog('saveChanges', 'BLOCKED - salvataggio già in corso');
        return;
    }
    
    debugLog('saveChanges', 'Salvataggio modifiche in corso...');
    
    const today = getTodayString();
    
    try {
        mutateSaving(true);
        renderServicePlanningPage();
        
        // Costruisci payload con SOLO giorni editabili (> oggi)
        const payload = {
            weekStart: servicePlanningState.weekStart,
            weekEnd: servicePlanningState.weekEnd,
            globalConstraints: { ...servicePlanningState.globalConstraints },
            days: servicePlanningState.days.map(d => ({
                date: d.date,
                dayName: getDayName(d.date),
                isActive: d.isActive,
                startTime: d.startTime || null,
                stopTime: d.endTime || null,
                isEditable: d.isEditable || false,
            })),
        };
        
        debugLog('saveChanges', 'Payload:', payload);
        
        const result = await saveWeekConfiguration(
            payload.weekStart,
            payload.globalConstraints,
            payload.days
        );
        
        debugLog('saveChanges', 'Risposta backend:', result);
        
        // Reset dirty state dopo successo
        resetDirtyState();
        mutateError(null);
        
        debugLog('saveChanges', 'Salvataggio completato con successo');
        
    } catch (error) {
        console.error('[ServicePlanningActions] Failed to save changes:', error);
        mutateError(error.message);
    } finally {
        mutateSaving(false);
        renderServicePlanningPage();
    }
}

// ============================================================================
// DATE PICKER ACTION
// ============================================================================

/**
 * Apre il date picker nativo
 * Questa funzione viene chiamata quando l'utente clicca sul blocco "Current Week"
 */
export function openDatePicker() {
    debugLog('openDatePicker', 'Apertura date picker');
    
    // Cerca l'input date hidden
    const dateInput = document.querySelector('[data-week-date-picker]');
    
    if (dateInput) {
        // Imposta il valore corrente all'inizio della settimana
        if (servicePlanningState.weekStart) {
            dateInput.value = servicePlanningState.weekStart;
        }
        
        // Prova showPicker() (browser moderni)
        if (typeof dateInput.showPicker === 'function') {
            try {
                dateInput.showPicker();
                debugLog('openDatePicker', 'showPicker() chiamato con successo');
            } catch (e) {
                // Fallback: focus + click
                dateInput.focus();
                dateInput.click();
                debugLog('openDatePicker', 'Fallback focus+click');
            }
        } else {
            // Fallback per browser che non supportano showPicker
            dateInput.focus();
            dateInput.click();
            debugLog('openDatePicker', 'showPicker non supportato, usando focus+click');
        }
    } else {
        console.warn('[ServicePlanningActions] Date picker input non trovato');
    }
}

/**
 * Handler per cambio data dal date picker
 */
export function onDatePickerChange(dateString) {
    debugLog('onDatePickerChange', 'Data selezionata:', dateString);
    
    if (dateString) {
        goToDate(dateString);
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get Monday of the week for a given date
 */
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    d.setDate(diff);
    return formatDate(d);
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Debug: forza ricalcolo dirty state
 */
export function debugForceRecalculateDirty() {
    updateDirtyState();
    renderServicePlanningPage();
    return servicePlanningState.isDirty;
}

/**
 * Debug: simula modifica per testing
 */
export function debugSimulateChange() {
    debugLog('debugSimulateChange', 'Simulazione modifica per test');
    
    const current = servicePlanningState.globalConstraints.maxOrdersPerSlot;
    mutateGlobalConstraint('maxOrdersPerSlot', current + 1);
    renderServicePlanningPage();
    
    return {
        newValue: servicePlanningState.globalConstraints.maxOrdersPerSlot,
        isDirty: servicePlanningState.isDirty
    };
}

// Esporta utility di debug su window per uso in console
if (typeof window !== 'undefined') {
    window.debugServicePlanningActions = {
        forceRecalculateDirty: debugForceRecalculateDirty,
        simulateChange: debugSimulateChange,
        loadWeek: loadWeekData,
        goToDate: goToDate,
    };
}

export default { 
    goToPrevWeek, goToNextWeek, goToDate, loadWeekData,
    incrementMaxOrders, decrementMaxOrders, incrementMaxPendingTime, decrementMaxPendingTime, updateLocation,
    toggleDay, updateDayStartTime, updateDayEndTime,
    saveChanges,
    openDatePicker, onDatePickerChange,
    isDayEditable
};
