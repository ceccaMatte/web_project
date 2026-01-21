import { homeState } from './home.state.js';
import { homeView } from './home.view.js';
import { openSidebar, closeSidebar, selectDay } from './home.actions.js';

/**
 * Aggiorna isSelected nei weekDays in base al selectedDayId corrente
 * 
 * RESPONSABILITÀ:
 * - Assicura che solo il giorno selezionato abbia isSelected = true
 * - Usato prima di renderizzare lo scheduler per preservare la selezione
 * 
 * @param {Array} weekDays - Array weekDays da state
 * @param {string} selectedDayId - ID del giorno attualmente selezionato
 * @returns {Array} - weekDays aggiornato con isSelected corretto
 */
function updateSchedulerSelection(weekDays, selectedDayId) {
    if (!selectedDayId || !weekDays || weekDays.length === 0) {
        return weekDays;
    }
    
    return weekDays.map(day => ({
        ...day,
        isSelected: day.id === selectedDayId,
    }));
}

// Components
import { renderTopBar } from '../../components/topbar/topbar.component.js';
import { renderSidebar } from '../../components/sidebar/sidebar.component.js';
import { renderTodayServiceCard } from '../../components/todayServiceCard/todayServiceCard.component.js';
import { renderWeekScheduler } from '../../components/weekScheduler/weekScheduler.component.js';
import { renderOrdersPreviewCard } from '../../components/ordersPreviewCard/ordersPreviewCard.component.js';
import { renderTimeSlotsList } from '../../components/timeSlotCard/timeSlotCard.component.js';

/**
 * Render completo pagina Home
 * 
 * WORKFLOW:
 * 1. Legge homeState
 * 2. Chiama component renderers con container + props + callbacks
 * 3. Ogni componente gestisce il proprio DOM
 * 
 * IDEMPOTENTE: Può essere chiamata N volte.
 * Ogni render rimpiazza il contenuto precedente.
 */
export function renderHome() {

    // 1. TopBar
    renderTopBar(
        homeView.refs.topBar,
        {
            user: homeState.user,
            sidebarOpen: homeState.sidebarOpen,
        },
        {
            onToggleSidebar: (isOpen) => isOpen ? openSidebar() : closeSidebar(),
        }
    );

    // 2. Sidebar
    renderSidebar(
        homeView.refs.sidebar,
        homeView.refs.overlay,
        {
            open: homeState.sidebarOpen,
            user: homeState.user,
        },
        {
            onClose: closeSidebar,
        }
    );

    // 3. Today Service Card
    renderTodayServiceCard(
        homeView.refs.todayServiceSection,
        homeState.todayService
    );

    // 4. Week Scheduler
    // IMPORTANTE: Aggiorna isSelected in base a selectedDayId corrente
    const weekDaysWithSelection = updateSchedulerSelection(
        homeState.weekDays,
        homeState.selectedDayId
    );
    
    renderWeekScheduler(
        homeView.refs.schedulerSection,
        {
            monthLabel: homeState.monthLabel,
            weekDays: weekDaysWithSelection,
        },
        {
            onDaySelected: selectDay,
        }
    );

    // 5. Orders Preview Header (dinamico in base a isAuthenticated)
    renderOrderPreviewHeader(
        homeView.refs.orderPreviewHeader,
        homeState.user.authenticated
    );

    // 6. Orders Preview Card (dinamico in base a autenticazione + ordini)
    // Orders preview logic: variant depends on authentication and ordersCount
    const ordersPreviewProps = getOrdersPreviewProps(
        homeState.user.authenticated,
        homeState.ordersPreview
    );
    
    renderOrdersPreviewCard(
        homeView.refs.orderPreviewContainer,
        ordersPreviewProps
    );

    // 7. Booking Header (data + location su 2 righe)
    renderBookingHeader(
        homeView.refs.bookingHeader,
        {
            dateLabel: homeState.booking.dateLabel,
            locationLabel: homeState.booking.locationLabel,
        }
    );

    // 8. Booking Slots (Time Slot Cards)
    renderTimeSlotsList(
        homeView.refs.bookingSlotsContainer,
        homeState.booking,
        {} // No callbacks per ora (usano href)
    );
}
 

/**
 * Renderizza l'header della sezione Order Preview
 * 
 * LOGICA:
 * - Se utente loggato: "Your Orders for Today" + "View All"
 * - Se utente NON loggato: "Track your orders" (NO "View All")
 * 
 * @param {HTMLElement} container - Container dell'header
 * @param {boolean} isAuthenticated - Stato autenticazione
 */
function renderOrderPreviewHeader(container, isAuthenticated) {
    if (!container) return;

    let html = '';

    if (isAuthenticated) {
        // UTENTE LOGGATO: titolo + CTA "View All"
        html = `
            <h3 class="text-white text-sm font-bold">
                Your Orders for Today
            </h3>
            <a 
                href="/orders"
                class="text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded"
                aria-label="View All"
            >
                View All
                <span class="material-symbols-outlined text-xs" aria-hidden="true">
                    arrow_forward
                </span>
            </a>
        `;
    } else {
        // UTENTE NON LOGGATO: solo titolo (stile coerente con SCHEDULE)
        html = `
            <h3 class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                Track your orders
            </h3>
        `;
    }

    container.innerHTML = html;
}

/**
 * Renderizza l'header della sezione Booking
 * 
 * LAYOUT:
 * - Riga 1: Data (bianco, font-bold)
 * - Riga 2: Location (grigio, text-xs)
 * 
 * @param {HTMLElement} container - Container dell'header
 * @param {object} props - {dateLabel, locationLabel}
 */
function renderBookingHeader(container, props) {
    if (!container) return;

    const { dateLabel, locationLabel } = props;

    if (!dateLabel || !locationLabel) return;

    const html = `
        <h3 class="text-white text-sm font-bold mb-1">
            ${dateLabel}
        </h3>
        <p class="text-slate-500 text-xs">
            ${locationLabel}
        </p>
    `;

    container.innerHTML = html;
}

/**
 * Calcola props per OrdersPreviewCard in base a stato autenticazione + ordini
 * 
 * LOGICA:
 * - Se NON autenticato → 'login-cta' (sempre)
 * - Se autenticato + 0 ordini → 'empty'
 * - Se autenticato + 1 ordine → 'single'
 * - Se autenticato + 2+ ordini → 'multi'
 * 
 * @param {boolean} isAuthenticated - Stato autenticazione
 * @param {object} ordersPreview - homeState.ordersPreview
 * @returns {object} - Props per renderOrdersPreviewCard
 */
function getOrdersPreviewProps(isAuthenticated, ordersPreview) {
    if (!isAuthenticated) {
        // Utente NON loggato → login CTA
        return {
            variant: 'login-cta',
            ordersCount: 0,
            selectedOrder: null,
        };
    }
    
    // Utente loggato → calcola variant in base a ordersCount
    const { ordersCount, selectedOrder } = ordersPreview;
    
    if (ordersCount === 0) {
        return {
            variant: 'empty',
            ordersCount: 0,
            selectedOrder: null,
        };
    } else if (ordersCount === 1) {
        return {
            variant: 'single',
            ordersCount: 1,
            selectedOrder,
        };
    } else {
        return {
            variant: 'multi',
            ordersCount,
            selectedOrder,
        };
    }
}

/**
 * Export default per import aggregato
 */
export default {
    renderHome,
};
