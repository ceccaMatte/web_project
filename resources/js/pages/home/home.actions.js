/**
 * HOME ACTIONS LAYER
 * 
 * RESPONSABILITÀ:
 * - Gestisce azioni utente sulla pagina Home
 * - Modifica homeState in risposta ad eventi
 * - Trigger render mirati o completi
 * - Gestisce polling automatico ogni 5 secondi
 * - Gestisce fetch e render dei time slots
 * 
 * ARCHITETTURA:
 * - Ogni action è una funzione che modifica state + rende
 * - Importato da componenti come callbacks
 * - Può chiamare API per fetch dati aggiuntivi
 * 
 * UTILIZZO:
 * import { openSidebar, closeSidebar, selectDay, startPolling, stopPolling } from './home.actions.js';
 */

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
import { renderTimeSlotsList } from '../../components/timeSlotCard/timeSlotCard.component.js';
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
    console.log(`[Actions] selectDay: ${dayId}`);
    
    if (!dayId) {
        console.warn('[Actions] selectDay: dayId is required');
        return;
    }

    // 1. Verifica che il giorno sia selezionabile
    const dayData = homeState.weekDays.find(day => day.id === dayId);
    if (!dayData) {
        console.warn(`[Actions] selectDay: day ${dayId} not found in weekDays`);
        return;
    }

    if (dayData.isDisabled || !dayData.isActive) {
        console.warn(`[Actions] selectDay: day ${dayId} is not selectable`);
        return;
    }

    // 2. Se già selezionato, non fare nulla (idempotenza)
    if (homeState.selectedDayId === dayId) {
        console.log(`[Actions] selectDay: day ${dayId} already selected, skipping`);
        return;
    }

    // 3. Aggiorna selectedDayId E selectedDate (sincronizzazione scheduler ↔ time slots)
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
        console.error('[Actions] loadTimeSlots: date is required');
        return;
    }

    console.log(`[Actions] Loading time slots for ${date}...`);
    
    try {
        // Indica loading
        mutateTimeSlots({ loading: true, error: null });
        
        // Fetch time slots
        const timeSlotsData = await fetchTimeSlots(date);
        
        // Trasforma i dati dal formato API al formato state
        const timeSlots = (timeSlotsData.slots || []).map(slot => ({
            id: slot.id,
            time: slot.timeLabel,
            available: slot.slotsLeft,
            isDisabled: slot.isDisabled,
            href: slot.href
        }));
        
        // Aggiorna state
        mutateTimeSlots({ 
            timeSlots: timeSlots,
            loading: false,
            error: null 
        });
        
        // Re-render time slots
        renderTimeSlots();
        
        console.log(`[Actions] Time slots loaded for ${date}:`, timeSlots.length, 'slots');
        
    } catch (error) {
        console.error(`[Actions] Failed to load time slots for ${date}:`, error);
        
        mutateTimeSlots({ 
            timeSlots: [],
            loading: false,
            error: 'Failed to load time slots' 
        });
        
        // Re-render time slots con errore
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
    console.log('[Actions] Loading initial time slots...');
    
    let targetDate = homeState.selectedDate;
    
    if (!targetDate) {
        // Inizializza selectedDate secondo le regole (oggi o primo giorno attivo)
        targetDate = initializeSelectedDate();
        console.log(`[Actions] Initialized selectedDate: ${targetDate}`);
    }
    
    if (targetDate) {
        await loadTimeSlots(targetDate);
    } else {
        console.warn('[Actions] No active days found, skipping time slots loading');
        mutateTimeSlots({ 
            timeSlots: [], 
            loading: false, 
            error: 'No active days available' 
        });
        renderTimeSlots();
    }
}

/**
 * Render time slots nella UI
 * 
 * RESPONSABILITÀ:
 * - Legge ESCLUSIVAMENTE da homeState.timeSlots e homeState.selectedDate
 * - Mostra loader, errore, o lista time slots
 * - NON fa fetch, NON modifica state
 */
function renderTimeSlots() {
    const container = homeView.refs.timeSlotsContainer;
    if (!container) {
        console.warn('[Actions] renderTimeSlots: container not found');
        return;
    }

    const { timeSlots, timeSlotsLoading, timeSlotsError, selectedDate } = homeState;

    if (timeSlotsLoading) {
        container.innerHTML = '<div class="text-slate-500 text-center py-4">Loading time slots...</div>';
        return;
    }

    if (timeSlotsError) {
        container.innerHTML = `<div class="text-red-500 text-center py-4">${timeSlotsError}</div>`;
        return;
    }

    if (!selectedDate) {
        container.innerHTML = '<div class="text-slate-500 text-center py-4">Select a day to view time slots</div>';
        return;
    }

    if (!timeSlots || timeSlots.length === 0) {
        container.innerHTML = '<div class="text-slate-500 text-center py-4">No time slots available for this day</div>';
        return;
    }

    // Render lista time slots
    const slotsHTML = timeSlots.map(slot => {
        const isDisabled = slot.isDisabled || slot.available <= 0;
        const availabilityText = slot.available > 0 ? `${slot.available} spots left` : 'Fully booked';
        
        return `
            <div class="bg-slate-800 rounded-lg p-4 ${isDisabled ? 'opacity-50' : ''}">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-white font-medium">${slot.time}</div>
                        <div class="text-slate-400 text-sm">${availabilityText}</div>
                    </div>
                    <button 
                        class="px-4 py-2 rounded-lg font-medium transition-colors ${
                            isDisabled 
                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }"
                        data-action="book-slot"
                        data-slot-id="${slot.id}"
                        data-slot-href="${slot.href}"
                        ${isDisabled ? 'disabled' : ''}
                    >
                        ${isDisabled ? 'Full' : 'Book'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = slotsHTML;
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
    console.log('[Actions] Book slot clicked');
    
    if (!homeState.user.authenticated) {
        console.log('[Actions] User not authenticated, redirecting to login');
        window.location.href = '/login';
        return;
    }
    
    // Utente autenticato: usa href dal slot
    const href = button.dataset.slotHref;
    if (href) {
        console.log(`[Actions] Redirecting to: ${href}`);
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
        console.warn('[Actions] Polling already active');
        return;
    }

    console.log('[Actions] Starting polling every 5 seconds...');
    
    const pollingTimer = setInterval(async () => {
        await runPolling();
    }, 5000); // 5 secondi

    mutatePolling({
        enabled: true,
        timer: pollingTimer,
        lastUpdate: null
    });

    console.log('[Actions] Polling started');
}

/**
 * Ferma polling automatico
 */
export function stopPolling() {
    if (!homeState.pollingEnabled || !homeState.pollingTimer) {
        console.warn('[Actions] No active polling to stop');
        return;
    }

    console.log('[Actions] Stopping polling...');
    
    clearInterval(homeState.pollingTimer);
    
    mutatePolling({
        enabled: false,
        timer: null,
        lastUpdate: null
    });

    console.log('[Actions] Polling stopped');
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
        console.warn('[Actions] runPolling: no selectedDate, skipping');
        return;
    }

    try {
        console.debug(`[Actions] Polling: fetching updates for selectedDate=${homeState.selectedDate}`);
        
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
            time: slot.time,
            available: slot.available,
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
        
        renderTimeSlots();
        
        mutatePolling({ lastUpdate: Date.now() });
        
        console.debug('[Actions] Polling update completed');
        
    } catch (error) {
        console.error('[Actions] Polling failed:', error);
        // NON interrompere il polling per errori temporanei
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
    console.log('[Actions] Logout clicked');
    
    try {
        const result = await logoutUser();
        
        if (!result.success) {
            console.error('[Actions] Logout failed:', result.message || result.error);
            
            if (result.error === 'csrf_mismatch') {
                alert('Session expired. Please refresh the page.');
            }
            return;
        }
        
        console.log('[Actions] Logout successful, refreshing page');
        window.location.reload();
        
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
    loadTimeSlots,
    loadInitialTimeSlots,
    bookSlot,
    startPolling,
    stopPolling,
    logout,
};
