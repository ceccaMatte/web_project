// Hydration utilities for admin work service

import { workServiceView } from './adminWorkService.view.js';
import { 
    workServiceState,
    mutateUser,
    mutateScheduler,
    mutateTimeSlots,
    mutateOrders,
    mutateLoading,
    mutatePolling,
    mutateError,
} from './adminWorkService.state.js';
import { fetchWorkServiceData, pollWorkServiceData } from './adminWorkService.api.js';
import { renderWorkServicePage, renderTimeSlotSelector, renderOrdersPipeline } from './adminWorkService.render.js';

/**
 * Idrata user state da script inline
 */
export function hydrateUserFromDOM() {
    const script = workServiceView.userStateScript;
    if (!script) {
        console.warn('User state script not found');
        return;
    }

    try {
        const userData = JSON.parse(script.textContent);
        mutateUser({
            authenticated: userData.authenticated || false,
            name: userData.name || null,
            nickname: userData.nickname || null,
            role: userData.role || null,
        });
    } catch (error) {
        console.error('Failed to parse user state:', error);
    }
}

/**
 * Genera scheduler per la settimana corrente
 * (per admin non serve hydrate da DOM, generiamo lato client)
 */
export function hydrateSchedulerFromDOM() {
    const today = new Date();
    const selectedDayId = formatDate(today);

    // Genera weekDays (7 giorni dalla settimana corrente)
    const weekDays = generateWeekDays(today, selectedDayId);
    const monthLabel = formatMonthLabel(today);

    mutateScheduler({ selectedDayId, monthLabel, weekDays });
}

/**
 * Fetch stato iniziale da API
 */
export async function refreshWorkServiceState(date) {
    try {
        mutateLoading(true);
        renderWorkServicePage();

        const data = await fetchWorkServiceData(date);

        mutateTimeSlots(data.timeSlots || [], data.currentTimeSlotId);
        mutateOrders(data.orders || []);
        mutateError(null);
    } catch (error) {
        console.error('Failed to refresh state:', error);
        mutateError(error.message);
    } finally {
        mutateLoading(false);
        renderWorkServicePage();
    }
}

/**
 * Polling refresh (NON interferisce con selezioni utente)
 */
export async function pollRefresh(date) {
    if (workServiceState.isUserInteracting) return;

    try {
        mutatePolling(true);
        const data = await pollWorkServiceData(date);

        // Aggiorna SOLO dati, non selezioni utente
        workServiceState.timeSlots = data.timeSlots || [];
        mutateOrders(data.orders || []);
        mutateError(null);
    } catch (error) {
        console.error('Poll failed:', error);
    } finally {
        mutatePolling(false);
        if (!workServiceState.isUserInteracting) {
            renderTimeSlotSelector();
            renderOrdersPipeline();
        }
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
 * Format month label (es. "January 2026")
 */
function formatMonthLabel(date) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Genera 7 giorni per la settimana corrente
 */
function generateWeekDays(referenceDate, selectedDayId) {
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const days = [];

    // Trova inizio settimana (lunedì)
    const startOfWeek = new Date(referenceDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Monday start
    startOfWeek.setDate(startOfWeek.getDate() + diff);

    const todayStr = formatDate(new Date());

    for (let i = 0; i < 7; i++) {
        const current = new Date(startOfWeek);
        current.setDate(startOfWeek.getDate() + i);

        const id = formatDate(current);
        const isToday = id === todayStr;
        const isSelected = id === selectedDayId;

        days.push({
            id,
            weekday: weekdays[current.getDay()],
            dayNumber: String(current.getDate()),
            isToday,
            isActive: true, // Admin can see any day
            isDisabled: false,
            isSelected,
        });
    }

    return days;
}

export default { hydrateUserFromDOM, hydrateSchedulerFromDOM, refreshWorkServiceState, pollRefresh };
