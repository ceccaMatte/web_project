/**
 * ORDERS RENDER ORCHESTRATOR
 * 
 * RESPONSABILITÀ:
 * - Orchestra render di tutti i componenti Orders page
 * - Passa container, props e callbacks ai componenti
 * - Legge da ordersState, NON lo modifica
 * - NON contiene markup HTML - solo orchestrazione
 * 
 * ARCHITETTURA:
 * - Funzione renderOrdersPage() chiamata dopo hydration o mutation state
 * - Importa tutti i component renderers
 * - Calcola props da state e le passa ai componenti
 * - Passa callbacks da orders.actions.js
 * 
 * UTILIZZO:
 * import { renderOrdersPage } from './orders.render.js';
 * 
 * // Dopo hydration o state change:
 * renderOrdersPage();
 */

import { ordersState } from './orders.state.js';
import { ordersView } from './orders.view.js';
import { 
    openSidebar, 
    closeSidebar, 
    selectDay,
    navigateActiveOrdersCarousel, 
    toggleOrderExpand,
    toggleOrderFavorite,
    toggleFavoritesOnly,
    navigateToCreate,
    navigateToModify,
    goBack,
    reorder 
} from './orders.actions.js';

// Componenti riutilizzabili
import { renderSidebar } from '../../components/sidebar/sidebar.component.js';
import { renderTopBar } from '../../components/topbar/topbar.component.js';
import { renderWeekScheduler } from '../../components/weekScheduler/weekScheduler.component.js';
import { renderOrdersHeader } from '../../components/ordersHeader/ordersHeader.component.js';
import { renderActiveOrdersSection as renderActiveOrdersSectionComponent } from '../../components/activeOrdersSection/activeOrdersSection.component.js';
import { renderRecentOrdersSection as renderRecentOrdersSectionComponent } from '../../components/recentOrdersSection/recentOrdersSection.component.js';

// ============================================================================
// UI LABELS & CONFIG (centralizzati)
// ============================================================================

/**
 * Labels per pagina Orders
 * Devono matchare config/ui.php['orders']
 */
const ordersLabels = {
    pageTitle: 'Your Orders',
    
    activeOrders: {
        sectionTitle: 'Active Orders',
        emptyMessage: 'Hungry? No active orders for today.',
        orderNowCta: 'Order Now',
        modify: 'Modify Order',
        showMore: 'Show More',
        showLess: 'Show Less',
    },
    
    recentOrders: {
        sectionTitle: 'Recently Ordered',
        noRecent: 'No recent orders yet.',
        favoritesOnly: 'Favorites only',
        showMore: 'Show More',
        showLess: 'Show Less',
        reorder: 'Reorder',
    },
    
    statusLabels: {
        pending: 'PENDING',
        confirmed: 'CONFIRMED',
        ready: 'READY',
        picked_up: 'PICKED UP',
        rejected: 'REJECTED',
    },
    
    icons: {
        empty: 'shopping_basket',
        add: 'add',
        favorite: 'star',
        favoriteOutline: 'star_outline',
    },
};

/**
 * Status colors per ordini
 */
const statusColors = {
    pending: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
    confirmed: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
    ready: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
    picked_up: { bg: 'bg-slate-100 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400' },
    rejected: { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400' },
};

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

/**
 * Render completo pagina Orders
 * 
 * WORKFLOW:
 * 1. Legge ordersState
 * 2. Calcola props per ogni componente
 * 3. Chiama component renderers con container + props + callbacks
 * 
 * IDEMPOTENTE: Può essere chiamata N volte.
 * Ogni render rimpiazza il contenuto precedente.
 */
export function renderOrdersPage() {
    console.log('[RenderOrders] Rendering complete orders UI...');

    // 1. TopBar (con hamburger + sidebar toggle)
    renderTopBarComponent();

    // 2. Sidebar
    renderSidebarComponent();

    // 3. Header (back button + title)
    renderHeader();

    // 4. Week Scheduler
    renderScheduler();

    // 5. Active Orders Section
    renderActiveOrdersSection();

    // 6. Recent Orders Section
    renderRecentOrdersSection();

    console.log('[RenderOrders] Complete orders UI rendered successfully');
}

// ============================================================================
// HEADER RENDER
// ============================================================================

/**
 * Render ordersHeader component
 */
export function renderHeader() {
    renderOrdersHeader(
        ordersView.refs.header,
        {
            title: ordersLabels.pageTitle,
        },
        {
            onBack: goBack,
        }
    );
}

// ============================================================================
// SIDEBAR RENDER
// ============================================================================

/**
 * Render TopBar component (hamburger + sidebar toggle)
 */
export function renderTopBarComponent() {
    renderTopBar(
        ordersView.refs.topBar,
        {
            user: ordersState.user,
            sidebarOpen: ordersState.sidebarOpen,
        },
        {
            onToggleSidebar: (isOpen) => isOpen ? openSidebar() : closeSidebar(),
        }
    );
}

/**
 * Render Sidebar component
 */
export function renderSidebarComponent() {
    renderSidebar(
        ordersView.refs.sidebar,
        ordersView.refs.overlay,
        {
            open: ordersState.sidebarOpen,
            user: ordersState.user,
        },
        {
            onClose: closeSidebar,
        }
    );
}

/**
 * Render solo Sidebar (per azioni isolate)
 */
export function renderSidebarAndTopbar() {
    renderSidebarComponent();
    renderHeader();
}

// ============================================================================
// SCHEDULER RENDER
// ============================================================================

/**
 * Aggiorna isSelected nei weekDays in base al selectedDayId corrente
 * 
 * RESPONSABILITÀ:
 * - Assicura che solo il giorno selezionato abbia isSelected = true
 * - Usato prima di renderizzare lo scheduler per preservare la selezione
 * - RISOLVE il bug dove il refresh/polling resettava la selezione a "today"
 * 
 * @param {Array} weekDays - Array weekDays da state
 * @param {string} selectedDayId - ID del giorno attualmente selezionato (es. "2026-01-16")
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

/**
 * Render Week Scheduler component
 * 
 * IMPORTANTE: Preserva la selezione del giorno durante i refresh/polling
 * aggiornando isSelected in base a ordersState.selectedDayId
 */
export function renderScheduler() {
    // Aggiorna isSelected con il selectedDayId corrente (NON usare quello del backend)
    const weekDaysWithSelection = updateSchedulerSelection(
        ordersState.weekDays,
        ordersState.selectedDayId
    );
    
    renderWeekScheduler(
        ordersView.refs.schedulerSection,
        {
            monthLabel: ordersState.monthLabel,
            weekDays: weekDaysWithSelection,
        },
        {
            onDaySelected: selectDay,
        }
    );
}

// ============================================================================
// ACTIVE ORDERS SECTION RENDER
// ============================================================================

/**
 * Render sezione Active Orders
 * 
 * Calcola props da state e chiama il componente.
 */
export function renderActiveOrdersSection() {
    const container = ordersView.refs.activeOrdersContainer;
    
    if (!container) {
        console.warn('[RenderOrders] activeOrdersContainer is null');
        return;
    }

    const { activeOrders, expandedOrderIds, loading, activeCarouselIndex } = ordersState;

    // Props per componente
    const props = {
        orders: activeOrders,
        activeIndex: activeCarouselIndex,
        expandedOrderIds: expandedOrderIds,
        loading: loading,
        labels: {
            sectionTitle: ordersLabels.activeOrders.sectionTitle,
            emptyMessage: ordersLabels.activeOrders.emptyMessage,
            orderNowCta: ordersLabels.activeOrders.orderNowCta,
            modify: ordersLabels.activeOrders.modify,
            showMore: ordersLabels.activeOrders.showMore,
            showLess: ordersLabels.activeOrders.showLess,
        },
        statusColors: statusColors,
        statusLabels: ordersLabels.statusLabels,
        icons: {
            empty: ordersLabels.icons.empty,
            add: ordersLabels.icons.add,
        },
    };

    // Callbacks
    const callbacks = {
        onToggleExpand: toggleOrderExpand,
        onModify: navigateToModify,
        onNavigate: navigateActiveOrdersCarousel,
        onOrderNow: navigateToCreate,
    };

    renderActiveOrdersSectionComponent(container, props, callbacks);

    console.log(`[RenderOrders] Active orders rendered: ${activeOrders.length}`);
}

// ============================================================================
// RECENT ORDERS SECTION RENDER
// ============================================================================

/**
 * Render sezione Recent Orders
 * 
 * Raggruppa ordini per giorno e passa al componente.
 */
export function renderRecentOrdersSection() {
    const container = ordersView.refs.recentOrdersSection;
    
    if (!container) {
        console.warn('[RenderOrders] recentOrdersSection is null');
        return;
    }

    const { recentOrders, expandedOrderIds, showOnlyFavorites } = ordersState;

    // Filtra per preferiti se richiesto
    const ordersToShow = showOnlyFavorites 
        ? recentOrders.filter(o => o.is_favorite)
        : recentOrders;

    // Raggruppa per giorno
    const ordersGroupedByDay = groupOrdersByDay(ordersToShow);

    // Props per componente
    const props = {
        ordersGroupedByDay: ordersGroupedByDay,
        expandedOrderIds: expandedOrderIds,
        showOnlyFavorites: showOnlyFavorites,
        labels: {
            sectionTitle: ordersLabels.recentOrders.sectionTitle,
            noRecent: ordersLabels.recentOrders.noRecent,
            favoritesOnly: ordersLabels.recentOrders.favoritesOnly,
            showMore: ordersLabels.recentOrders.showMore,
            showLess: ordersLabels.recentOrders.showLess,
            reorder: ordersLabels.recentOrders.reorder,
        },
        icons: {
            favorite: ordersLabels.icons.favorite,
            favoriteOutline: ordersLabels.icons.favoriteOutline,
        },
    };

    // Callbacks
    const callbacks = {
        onToggleExpand: toggleOrderExpand,
        onToggleFavorite: toggleOrderFavorite,
        onReorder: reorder,
        onToggleFavoritesFilter: toggleFavoritesOnly,
    };

    renderRecentOrdersSectionComponent(container, props, callbacks);

    console.log(`[RenderOrders] Recent orders rendered: ${ordersToShow.length}`);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Raggruppa ordini per giorno
 * 
 * @param {Array} orders - Array di ordini
 * @returns {Array<{dayLabel, orders}>} - Ordini raggruppati per giorno
 */
function groupOrdersByDay(orders) {
    if (!orders || orders.length === 0) return [];

    const groups = {};
    
    orders.forEach(order => {
        const dateStr = order.date;
        if (!groups[dateStr]) {
            groups[dateStr] = {
                dayLabel: formatDayLabel(dateStr),
                orders: [],
            };
        }
        groups[dateStr].orders.push(order);
    });

    // Ordina per data decrescente
    return Object.values(groups).sort((a, b) => {
        const dateA = a.orders[0]?.date || '';
        const dateB = b.orders[0]?.date || '';
        return dateB.localeCompare(dateA);
    });
}

/**
 * Formatta label giorno (es. "TUE 12")
 * 
 * @param {string} dateStr - Data in formato YYYY-MM-DD
 * @returns {string} - Label formattata
 */
function formatDayLabel(dateStr) {
    if (!dateStr) return '';
    
    try {
        const date = new Date(dateStr);
        const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const weekday = weekdays[date.getDay()];
        const day = date.getDate();
        return `${weekday} ${day}`;
    } catch {
        return dateStr;
    }
}

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Export default per import aggregato
 */
export default {
    renderOrdersPage,
    renderSidebarAndTopbar,
    renderScheduler,
    renderActiveOrdersSection,
    renderRecentOrdersSection,
};
