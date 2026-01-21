import { homeState, mutateTimeSlots } from './home.state.js';
import { fetchHome } from './home.api.js';

export async function refreshHomeState() {
    try {
        const data = await fetchHome();
        hydrateHomeState(data);
        const { renderHome } = await import('./home.render.js');
        renderHome();
    } catch (error) {
        console.error('Failed to refresh home state:', error);
    }
}

export function hydrateHomeState(data) {
    if (!data) return;

    if (data.user) {
        homeState.user = {
            authenticated: Boolean(data.user.authenticated),
            enabled: Boolean(data.user.enabled),
            name: data.user.name || null,
        };
    }

    if (data.todayService) {
        homeState.todayService = {
            status: data.todayService.status || 'inactive',
            location: data.todayService.location || null,
            startTime: data.todayService.startTime || null,
            endTime: data.todayService.endTime || null,
            queueTime: data.todayService.queueTime !== null ? Number(data.todayService.queueTime) : null,
        };
    }

    if (data.scheduler) {
        homeState.selectedDayId = data.scheduler.selectedDayId || null;
        homeState.selectedDate = data.scheduler.selectedDayId || null;
        homeState.monthLabel = data.scheduler.monthLabel || null;
        homeState.weekDays = Array.isArray(data.scheduler.weekDays) ? data.scheduler.weekDays : [];
    }

    if (data.ordersPreview) {
        homeState.ordersPreview = {
            variant: data.ordersPreview.variant || 'login-cta',
            ordersCount: Number(data.ordersPreview.ordersCount) || 0,
            selectedOrder: data.ordersPreview.selectedOrder || null,
        };
    }

    if (data.booking) {
        homeState.booking = {
            dateLabel: data.booking.dateLabel || null,
            locationLabel: data.booking.locationLabel || null,
            slots: Array.isArray(data.booking.slots) ? data.booking.slots : [],
        };
    }

    if (data.initialTimeSlots && Array.isArray(data.initialTimeSlots)) {
        mutateTimeSlots({ timeSlots: data.initialTimeSlots, loading: false, error: null });
    }
}

export default {
    refreshHomeState,
    hydrateHomeState,
};
