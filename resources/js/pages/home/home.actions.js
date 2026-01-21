// Home page actions (state updates and targeted renders)

import { 
    homeState, 
    mutateSidebar, 
    mutateSelectedDay, 
    mutateUser, 
    mutateBooking, 
    mutateOrdersPreview,
    mutateTimeSlots,
    mutateTodayService,
    mutatePolling,
    initializeSelectedDate
} from './home.state.js';
import { fetchBookingForDay, logoutUser, fetchTimeSlots, fetchPolling } from './home.api.js';
import { renderHome } from './home.render.js';
import { renderSidebar } from '../../components/sidebar/sidebar.component.js';
import { renderTopBar } from '../../components/topbar/topbar.component.js';
import { renderWeekScheduler } from '../../components/weekScheduler/weekScheduler.component.js';
import { renderTimeSlotCard, renderTimeSlotsList } from '../../components/timeSlotCard/timeSlotCard.component.js';
import { renderTodayServiceCard } from '../../components/todayServiceCard/todayServiceCard.component.js';
import { homeView } from './home.view.js';

/**
 * Apri sidebar
 * 
 * WORKFLOW:
 * 1. Aggiorna homeState.sidebarOpen = true
 * 2. Re-render sidebar + topbar
 */
export function openSidebar() {
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
 * Seleziona giorno nello scheduler E fetch time slots
 * 
 * PRINCIPIO FONDAMENTALE:
 * I time slots mostrati DEVONO SEMPRE corrispondere
 * al giorno selezionato nello scheduler.
 * 
 * WORKFLOW:
 * 1. Valida che il giorno sia selezionabile
 * 2. Aggiorna selectedDayId E selectedDate (sincronizzazione)
 * 3. Re-render scheduler immediato per feedback visivo
 * 4. Fetch time slots per il giorno selezionato
 * 5. Re-render time slots con i nuovi dati
 * 
 * @param {string} dayId - ID giorno nel formato YYYY-MM-DD
 */
export async function selectDay(dayId) {
    if (!dayId) return;
    const dayData = homeState.weekDays.find(day => day.id === dayId);
    if (!dayData || dayData.isDisabled || !dayData.isActive) return;
    if (homeState.selectedDayId === dayId) return;
    mutateSelectedDay(dayId);
    
    // 4. Re-render scheduler immediato per feedback visivo
    renderWeekScheduler(
        homeView.refs.schedulerSection,
        { monthLabel: homeState.monthLabel, weekDays: homeState.weekDays },
        { onDaySelected: selectDay }
    );

    // 5. Fetch time slots per il giorno selezionato
    await loadTimeSlots(dayId);
}

/**
 * Carica time slots per una data specifica
 * 
 * RESPONSABILITÀ:
 * - Fetch dei time slots dal backend
 * - Aggiorna homeState.timeSlots
 * - Re-render della sezione time slots
 * - Gestione errori
 * 
 * IMPORTANTE: Questa funzione è usata sia da selectDay che da loadInitialTimeSlots
 * 
 * @param {string} date - Data in formato YYYY-MM-DD
 */
export async function loadTimeSlots(date) {
    if (!date) {
        console.error('loadTimeSlots: date is required');
        return;
    }

    try {
        // Indica loading
        mutateTimeSlots({ loading: true, error: null });
        
        // Fetch time slots
        const timeSlotsData = await fetchTimeSlots(date);
        
        // Trasforma i dati dal formato API al formato state
        const timeSlots = (timeSlotsData.slots || []).map(slot => ({
            id: slot.id,
            timeLabel: slot.timeLabel,
            slotsLeft: slot.slotsLeft,
            isDisabled: slot.isDisabled,
            href: slot.href
        }));
        
        // Aggiorna state
        mutateTimeSlots({ 
            timeSlots: timeSlots,
            loading: false,
            error: null 
        });
        
        // Re-render time slots and header
        renderBookingHeader();
        renderTimeSlots();
        
    } catch (error) {
        console.error('Failed to load time slots for', date, error);
        mutateTimeSlots({ 
            timeSlots: [],
            loading: false,
            error: 'Failed to load time slots' 
        });
        
        // Re-render time slots e header con errore
        renderBookingHeader();
        renderTimeSlots();
    }
}

/**
 * Carica time slots iniziali basati su selectedDate
 * 
 * Chiamata durante l'inizializzazione della home.
 * Determina automaticamente quale giorno caricare secondo le regole:
 * 1. Se selectedDate è già impostato → carica quello
 * 2. Altrimenti inizializza selectedDate e carica i time slots
 */
export async function loadInitialTimeSlots() {
    let targetDate = homeState.selectedDate;
    
    if (!targetDate) targetDate = initializeSelectedDate();
    
    if (targetDate) {
        // If time slots for the selected date are already hydrated (from initialTimeSlots), skip fetch
        if (homeState.timeSlots && homeState.timeSlots.length > 0 && homeState.selectedDate === targetDate) {
            // Ensure UI is rendered with the existing slots
            renderBookingHeader();
            renderTimeSlots();
        } else {
            await loadTimeSlots(targetDate);
        }
    } else {
        console.warn('No active days found');
        mutateTimeSlots({ 
            timeSlots: [], 
            loading: false, 
            error: 'No active days available' 
        });
        renderBookingHeader();
        renderTimeSlots();
    }
}

/**
 * Render time slots nella UI
 * 
 * RESPONSABILITÀ:
 * - Legge ESCLUSIVAMENTE da homeState.timeSlots e homeState.selectedDate
 * - Mostra loader, errore, o lista time slots
 * - USA SOLO data-booking-slots-container (ERRORE PRECEDENTE: usava data-time-slots-container)
 * - NON fa fetch, NON modifica state
 * 
 * CORREZIONE ARCHITETTURALE:
 * - Prima esisteva una sezione separata data-time-slots-section (SBAGLIATA)
 * - Ora usa ESCLUSIVAMENTE data-booking-section esistente
 */
function renderTimeSlots() {
    const container = homeView.refs.bookingSlotsContainer;
    if (!container) return;

    const { timeSlots, timeSlotsLoading, timeSlotsError, selectedDate } = homeState;
    if (timeSlotsLoading) return void (container.innerHTML = '<div class="text-slate-500 text-center py-4">Loading time slots...</div>');
    if (timeSlotsError) return void (container.innerHTML = `<div class="text-red-500 text-center py-4">${timeSlotsError}</div>`);
    if (!selectedDate) return void (container.innerHTML = '<div class="text-slate-500 text-center py-4">Select a day to view time slots</div>');
    if (!timeSlots || timeSlots.length === 0) return void (container.innerHTML = '<div class="text-slate-500 text-center py-4">No time slots available for this day</div>');

    const slotsHTML = timeSlots.map(slot => renderTimeSlotCard(slot, 'home')).join('');
    container.innerHTML = `<div class="flex gap-3 overflow-x-auto">${slotsHTML}</div>`;
}

/**
 * Render booking header con giorno selezionato
 * 
 * RESPONSABILITÀ:
 * - Mostra il giorno selezionato e la location
 * - DEVE corrispondere SEMPRE a selectedDate
 * - Usa data-booking-header esistente
 */
function renderBookingHeader() {
    const headerContainer = homeView.refs.bookingHeader;
    if (!headerContainer) {
        console.warn('Booking header container not found');
        return;
    }

    const { selectedDate } = homeState;
    
    if (!selectedDate) {
        headerContainer.innerHTML = '';
        return;
    }

    // Formatta la data per visualizzazione
    const date = new Date(selectedDate + 'T00:00:00');
    const dateLabel = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });

    headerContainer.innerHTML = `
        <h3 class="text-white text-sm font-bold mb-1">
            ${dateLabel}
        </h3>
        <p class="text-slate-500 text-xs">
            Engineering Hub - Available Time Slots
        </p>
    `;
}

/**
 * Gestisce click su bottone "Book" di un time slot
 * 
 * WORKFLOW:
 * - Se utente NON autenticato → redirect a /login
 * - Se utente autenticato → usa href del slot per navigazione
 * 
 * @param {HTMLElement} button - Bottone cliccato
 */
export function bookSlot(button) {
    if (!homeState.user.authenticated) {
        window.location.href = '/login';
        return;
    }
    
    // Utente autenticato: usa href dal slot
    const href = button.dataset.slotHref;
    if (href) {
        window.location.href = href;
    }
}

/**
 * Avvia polling automatico ogni 5 secondi
 * 
 * RESPONSABILITÀ:
 * - Configura timer setInterval
 * - Chiama endpoint /api/home/polling
 * - Aggiorna truck card (sempre today)
 * - Aggiorna ordini utente (solo today) 
 * - Aggiorna time slots (del giorno selezionato)
 * 
 * IMPORTANTE:
 * - Il polling NON cambia selectedDate
 * - Il polling è SILENZIOSO (no reload UI)
 * - Gestisce errori senza interrompere il polling
 */
export function startPolling() {
    // Se già attivo, non avviare un secondo timer
    if (homeState.pollingEnabled) {
        console.warn('Polling already active');
        return;
    }
    const pollingTimer = setInterval(async () => {
        await runPolling();
    }, 5000); // 5 secondi

    mutatePolling({
        enabled: true,
        timer: pollingTimer,
        lastUpdate: null
    });

}

/**
 * Ferma polling automatico
 */
export function stopPolling() {
    if (!homeState.pollingEnabled || !homeState.pollingTimer) {
        console.warn('No active polling to stop');
        return;
    }
    clearInterval(homeState.pollingTimer);
    
    mutatePolling({
        enabled: false,
        timer: null,
        lastUpdate: null
    });

}

/**
 * Esegue una singola richiesta di polling
 * 
 * CHIAMATA:
 * - Ogni 5 secondi dal timer
 * - Una volta manuale durante l'inizializzazione
 */
async function runPolling() {
    if (!homeState.selectedDate) {
        console.warn('runPolling: no selectedDate');
        return;
    }

    try {
        
        const pollingData = await fetchPolling(homeState.selectedDate);
        
        // Aggiorna truck card con dati TODAY (non selectedDate)
        const todayStatus = pollingData.today.is_active ? 'active' : 'inactive';
        mutateTodayService({
            status: todayStatus,
            location: pollingData.today.location,
            startTime: pollingData.today.start_time,
            endTime: pollingData.today.end_time,
        });

        // Aggiorna time slots con dati del selectedDate
        const timeSlots = (pollingData.selected_day_slots || []).map(slot => ({
            id: slot.id,
            timeLabel: slot.time,
            slotsLeft: slot.available,
            isDisabled: slot.available <= 0,
            href: slot.href || `/orders/create?slot=${slot.id}`
        }));
        
        mutateTimeSlots({ 
            timeSlots: timeSlots,
            loading: false,
            error: null 
        });

        // TODO: Aggiorna ordini utente quando saranno implementati
        
        // Re-render silent components
        renderTodayServiceCard(
            homeView.refs.todayServiceSection,
            homeState.todayService,
            {}
        );
        
        renderBookingHeader();
        renderTimeSlots();
        
        mutatePolling({ lastUpdate: Date.now() });
        
    } catch (error) {
        console.error('Polling failed:', error);
    }
}

/**
 * Gestisce logout utente
 * 
 * WORKFLOW:
 * 1. Chiama API POST /logout
 * 2. Refresh completo della pagina
 */
export async function logout() {
    try {
        const result = await logoutUser();
        
        if (!result.success) {
            console.error('Logout failed:', result.message || result.error);
            if (result.error === 'csrf_mismatch') alert('Session expired. Please refresh the page.');
            return;
        }
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
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
    loadTimeSlots,
    loadInitialTimeSlots,
    bookSlot,
    startPolling,
    stopPolling,
    logout,
};
