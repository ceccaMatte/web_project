// Render orchestrator for Orders page

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

}

// ============================================================================
// HEADER RENDER
// ============================================================================

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

export function renderSidebarAndTopbar() {
    renderSidebarComponent();
    renderHeader();
}

// ============================================================================
// SCHEDULER RENDER
// ============================================================================

function updateSchedulerSelection(weekDays, selectedDayId) {
    if (!selectedDayId || !weekDays || weekDays.length === 0) {
        return weekDays;
    }
    
    return weekDays.map(day => ({
        ...day,
        isSelected: day.id === selectedDayId,
    }));
}

export function renderScheduler() {
    // preserve selectedDayId selection
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
}

// ============================================================================
// RECENT ORDERS SECTION RENDER
// ============================================================================

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
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
