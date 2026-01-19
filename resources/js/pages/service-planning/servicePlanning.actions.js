/**
 * SERVICE PLANNING ACTIONS
 * 
 * RESPONSABILITÀ:
 * - Gestisce azioni utente
 * - Muta state
 * - Trigger render
 * - Comunicazione API per side effects
 */

import { servicePlanningState, mutateWeek, mutateGlobalConstraint, mutateGlobalConstraints, 
         toggleDayActive, mutateDayTime, mutateLoading, mutateSaving, mutateError,
         setOriginalGlobalConstraints, setOriginalDays, mutateDays, resetDirtyState } from './servicePlanning.state.js';
import { fetchWeekData, saveWeekConfiguration } from './servicePlanning.api.js';
import { renderServicePlanningPage } from './servicePlanning.render.js';

// ============================================================================
// WEEK NAVIGATION
// ============================================================================

/**
 * Naviga alla settimana precedente
 */
export async function goToPrevWeek() {
    console.log('[ServicePlanningActions] Going to previous week');
    
    const currentStart = new Date(servicePlanningState.weekStart);
    currentStart.setDate(currentStart.getDate() - 7);
    
    const newWeekStart = formatDate(currentStart);
    await loadWeekData(newWeekStart);
}

/**
 * Naviga alla settimana successiva
 */
export async function goToNextWeek() {
    console.log('[ServicePlanningActions] Going to next week');
    
    const currentStart = new Date(servicePlanningState.weekStart);
    currentStart.setDate(currentStart.getDate() + 7);
    
    const newWeekStart = formatDate(currentStart);
    await loadWeekData(newWeekStart);
}

/**
 * Naviga a una data specifica (calcola la settimana)
 */
export async function goToDate(dateString) {
    console.log(`[ServicePlanningActions] Going to date: ${dateString}`);
    
    const date = new Date(dateString);
    const weekStart = getWeekStart(date);
    
    await loadWeekData(weekStart);
}

/**
 * Carica dati per una settimana
 */
export async function loadWeekData(weekStart) {
    console.log(`[ServicePlanningActions] Loading week data for ${weekStart}`);
    
    try {
        mutateLoading(true);
        renderServicePlanningPage();
        
        const data = await fetchWeekData(weekStart);
        
        // Update state with fetched data
        mutateWeek(data.weekStart, data.weekEnd, data.isEditable);
        mutateGlobalConstraints(data.globalConstraints);
        setOriginalGlobalConstraints(data.globalConstraints);
        mutateDays(data.days);
        setOriginalDays(data.days);
        
        mutateError(null);
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
 */
export function incrementMaxOrders() {
    if (!servicePlanningState.isWeekEditable) return;
    
    const current = servicePlanningState.globalConstraints.maxOrdersPerSlot;
    mutateGlobalConstraint('maxOrdersPerSlot', current + 1);
    renderServicePlanningPage();
}

/**
 * Decrementa max orders per slot
 */
export function decrementMaxOrders() {
    if (!servicePlanningState.isWeekEditable) return;
    
    const current = servicePlanningState.globalConstraints.maxOrdersPerSlot;
    if (current > 1) {
        mutateGlobalConstraint('maxOrdersPerSlot', current - 1);
        renderServicePlanningPage();
    }
}

/**
 * Incrementa max pending time
 */
export function incrementMaxPendingTime() {
    if (!servicePlanningState.isWeekEditable) return;
    
    const current = servicePlanningState.globalConstraints.maxPendingTime;
    mutateGlobalConstraint('maxPendingTime', current + 5);
    renderServicePlanningPage();
}

/**
 * Decrementa max pending time
 */
export function decrementMaxPendingTime() {
    if (!servicePlanningState.isWeekEditable) return;
    
    const current = servicePlanningState.globalConstraints.maxPendingTime;
    if (current > 5) {
        mutateGlobalConstraint('maxPendingTime', current - 5);
        renderServicePlanningPage();
    }
}

/**
 * Aggiorna location
 */
export function updateLocation(value) {
    if (!servicePlanningState.isWeekEditable) return;
    
    mutateGlobalConstraint('location', value);
    renderServicePlanningPage();
}

// ============================================================================
// DAY ACTIONS
// ============================================================================

/**
 * Toggle giorno attivo/inattivo
 */
export function toggleDay(date) {
    console.log(`[ServicePlanningActions] Toggling day: ${date}`);
    
    toggleDayActive(date);
    renderServicePlanningPage();
}

/**
 * Aggiorna orario inizio giorno
 */
export function updateDayStartTime(date, time) {
    console.log(`[ServicePlanningActions] Updating start time for ${date}: ${time}`);
    
    mutateDayTime(date, 'startTime', time);
    renderServicePlanningPage();
}

/**
 * Aggiorna orario fine giorno
 */
export function updateDayEndTime(date, time) {
    console.log(`[ServicePlanningActions] Updating end time for ${date}: ${time}`);
    
    mutateDayTime(date, 'endTime', time);
    renderServicePlanningPage();
}

// ============================================================================
// SAVE ACTION
// ============================================================================

/**
 * Salva tutte le modifiche
 */
export async function saveChanges() {
    if (!servicePlanningState.isDirty || !servicePlanningState.isWeekEditable) {
        console.log('[ServicePlanningActions] Nothing to save or not editable');
        return;
    }
    
    console.log('[ServicePlanningActions] Saving changes...');
    
    try {
        mutateSaving(true);
        renderServicePlanningPage();
        
        const payload = {
            weekStart: servicePlanningState.weekStart,
            weekEnd: servicePlanningState.weekEnd,
            globalConstraints: { ...servicePlanningState.globalConstraints },
            days: servicePlanningState.days
                .filter(d => d.isEditable)
                .map(d => ({
                    date: d.date,
                    isActive: d.isActive,
                    startTime: d.startTime,
                    endTime: d.endTime,
                })),
        };
        
        await saveWeekConfiguration(payload);
        
        // Reset dirty state after successful save
        resetDirtyState();
        mutateError(null);
        
        console.log('[ServicePlanningActions] Changes saved successfully');
    } catch (error) {
        console.error('[ServicePlanningActions] Failed to save changes:', error);
        mutateError(error.message);
    } finally {
        mutateSaving(false);
        renderServicePlanningPage();
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

export default { 
    goToPrevWeek, goToNextWeek, goToDate, loadWeekData,
    incrementMaxOrders, decrementMaxOrders, incrementMaxPendingTime, decrementMaxPendingTime, updateLocation,
    toggleDay, updateDayStartTime, updateDayEndTime,
    saveChanges 
};
