/**
 * HOME ACTIONS LAYER
 * 
 * RESPONSABILITÀ:
 * - Gestisce azioni utente sulla pagina Home
 * - Modifica homeState in risposta ad eventi
 * - Trigger render mirati o completi
 * 
 * ARCHITETTURA:
 * - Ogni action è una funzione che modifica state + rende
 * - Importato da componenti come callbacks
 * - Può chiamare API per fetch dati aggiuntivi
 * 
 * UTILIZZO:
 * import { openSidebar, closeSidebar, selectDay } from './home.actions.js';
 * 
 * // Da component callback:
 * onToggleSidebar: (isOpen) => isOpen ? openSidebar() : closeSidebar()
 */

import { homeState, mutateSidebar, mutateSelectedDay, mutateUser, mutateBooking, mutateOrdersPreview } from './home.state.js';
import { fetchBookingForDay, logoutUser, fetchTimeSlots } from './home.api.js';
import { renderHome } from './home.render.js';
import { renderSidebar } from '../../components/sidebar/sidebar.component.js';
import { renderTopBar } from '../../components/topbar/topbar.component.js';
import { renderWeekScheduler } from '../../components/weekScheduler/weekScheduler.component.js';
import { renderTimeSlotsList } from '../../components/timeSlotCard/timeSlotCard.component.js';
import { homeView } from './home.view.js';

/**
 * Apri sidebar
 * 
 * WORKFLOW:
 * 1. Aggiorna homeState.sidebarOpen = true
 * 2. Re-render sidebar + topbar
 */
export function openSidebar() {
    console.log('[Actions] Opening sidebar');
    
    mutateSidebar(true);
    
    // Render solo sidebar e topbar (ottimizzazione)
    renderSidebar(
        homeView.refs.sidebar,
        homeView.refs.overlay,
        { open: true, user: homeState.user },
        { onClose: closeSidebar }
    );

    // Re-render topbar per cambiare icona
    renderTopBar(
        homeView.refs.topBar,
        { user: homeState.user, sidebarOpen: true },
        { onToggleSidebar: (isOpen) => isOpen ? openSidebar() : closeSidebar() }
    );
}

/**
 * Chiudi sidebar
 * 
 * WORKFLOW:
 * 1. Aggiorna homeState.sidebarOpen = false
 * 2. Re-render sidebar + topbar
 */
export function closeSidebar() {
    console.log('[Actions] Closing sidebar');
    
    mutateSidebar(false);
    
    // Render solo sidebar e topbar
    renderSidebar(
        homeView.refs.sidebar,
        homeView.refs.overlay,
        { open: false, user: homeState.user },
        { onClose: closeSidebar }
    );

    // Re-render topbar per cambiare icona
    renderTopBar(
        homeView.refs.topBar,
        { user: homeState.user, sidebarOpen: false },
        { onToggleSidebar: (isOpen) => isOpen ? openSidebar() : closeSidebar() }
    );
}

/**
 * Seleziona giorno nello scheduler
 * 
 * WORKFLOW:
 * 1. Aggiorna homeState.selectedDayId
 * 2. Aggiorna weekDays.isSelected
 * 3. Fetch time slots per quel giorno da API
 * 4. Aggiorna homeState.booking con nuovi slots
 * 5. Re-render scheduler + booking slots
 * 
 * @param {string} dayId - ID giorno (YYYY-MM-DD)
 */
export async function selectDay(dayId) {
    console.log(`[Actions] Selecting day: ${dayId}`);
    
    if (!dayId) {
        console.warn('[Actions] selectDay: dayId is required');
        return;
    }

    // 1. Aggiorna state
    mutateSelectedDay(dayId);
    console.log('[Actions] State updated, weekDays:', homeState.weekDays.map(d => ({id: d.id, isSelected: d.isSelected})));

    // 2. Re-render scheduler (immediato per feedback visivo)
    renderWeekScheduler(
        homeView.refs.schedulerSection,
        { monthLabel: homeState.monthLabel, weekDays: homeState.weekDays },
        { onDaySelected: selectDay }
    );

    // 3. Fetch time slots per il giorno selezionato
    try {
        console.debug(`[Actions] Fetching time slots for ${dayId}...`);
        const timeSlotsData = await fetchTimeSlots(dayId);
        
        console.debug('[Actions] TimeSlots received:', {
            dateLabel: timeSlotsData.dateLabel,
            locationLabel: timeSlotsData.locationLabel,
            slotsCount: timeSlotsData.slots?.length || 0,
        });
        
        // 4. Aggiorna booking state con nuovi slots
        mutateBooking(timeSlotsData);
        
        console.debug('[Actions] State AFTER mutateBooking:', {
            dateLabel: homeState.booking.dateLabel,
            locationLabel: homeState.booking.locationLabel,
            slotsCount: homeState.booking.slots?.length || 0,
            slots: homeState.booking.slots,
        });
        
        // 5. Re-render booking slots con nuovi dati
        renderTimeSlotsList(
            homeView.refs.bookingSlotsContainer,
            homeState.booking,
            {} // No callbacks (usano href)
        );
        
        // 6. Re-render booking header con nuova data
        const bookingHeader = homeView.refs.bookingHeader;
        if (bookingHeader) {
            bookingHeader.innerHTML = `
                <h3 class="text-white text-sm font-bold mb-1">
                    ${timeSlotsData.dateLabel || ''}
                </h3>
                <p class="text-slate-500 text-xs">
                    ${timeSlotsData.locationLabel || ''}
                </p>
            `;
        }
        
        console.log(`[Actions] Day selected and time slots loaded: ${dayId}`);
        
    } catch (error) {
        console.error(`[Actions] Failed to fetch time slots for ${dayId}:`, error);
        // TODO: Mostrare errore all'utente
    }
}

/**
 * Gestisce click su bottone "Prenota" slot
 * 
 * WORKFLOW:
 * - Se utente NON autenticato → redirect a /login
 * - Se utente autenticato → redirect a /orders/create?slot={slotId}
 * 
 * @param {string} slotId - ID dello slot da prenotare
 */
export function bookSlot(slotId) {
    console.log(`[Actions] Book slot clicked: ${slotId}`);
    
    if (!homeState.user.authenticated) {
        console.log('[Actions] User not authenticated, redirecting to login');
        window.location.href = '/login';
        return;
    }
    
    // Utente autenticato: vai alla pagina di creazione ordine
    console.log('[Actions] User authenticated, redirecting to order creation');
    window.location.href = `/orders/create?slot=${slotId}`;
}

/**
 * Gestisce logout utente
 * 
 * WORKFLOW:
 * 1. Chiama API POST /logout
 * 2. Aggiorna homeState.user.authenticated = false
 * 3. Re-render completo Home in modalità guest
 * 4. NON fa redirect (resta sulla Home)
 * 
 * VINCOLI:
 * - Nessun window.location
 * - Nessun redirect backend
 * - Aggiorna solo stato e UI
 */
export async function logout() {
    console.log('[Actions] Logout clicked');
    console.debug('[Actions] State BEFORE logout:', structuredClone({
        user: homeState.user,
        ordersPreview: homeState.ordersPreview,
    }));
    
    try {
        // 1. Chiama API logout
        const result = await logoutUser();
        
        if (!result.success) {
            console.error('[Actions] Logout failed:', result.message || result.error);
            
            // Se errore CSRF 419, suggerisci refresh
            if (result.error === 'csrf_mismatch') {
                alert('Session expired. Please refresh the page.');
            }
            return;
        }
        
        console.log('[Actions] Logout successful, updating state');
        
        // 2. Aggiorna stato utente (diventa guest)
        mutateUser({
            authenticated: false,
            enabled: false,
            name: null,
        });
        
        // 3. Reset ordini (guest non ha ordini)
        mutateOrdersPreview({
            variant: 'login-cta',
            ordersCount: 0,
            selectedOrder: null,
        });
        
        // 4. Chiudi sidebar se aperta
        if (homeState.sidebarOpen) {
            mutateSidebar(false);
        }
        
        console.debug('[Actions] State AFTER logout:', structuredClone({
            user: homeState.user,
            ordersPreview: homeState.ordersPreview,
        }));
        
        // 5. Re-render completo in modalità guest
        renderHome();
        
        console.log('[Actions] Home re-rendered in guest mode');
        
    } catch (error) {
        console.error('[Actions] Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}

/**
 * Export default per import aggregato
 */
export default {
    openSidebar,
    closeSidebar,
    selectDay,
    bookSlot,
    logout,
};
