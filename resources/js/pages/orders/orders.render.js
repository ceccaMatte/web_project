/**
 * ORDERS RENDER ORCHESTRATOR
 * 
 * RESPONSABILITÀ:
 * - Orchestra render di tutti i componenti Orders page
 * - Passa container, props e callbacks ai componenti
 * - Legge da ordersState, NON lo modifica
 * 
 * ARCHITETTURA:
 * - Funzione renderOrdersPage() chiamata dopo hydration o mutation state
 * - Importa tutti i component renderers
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
    toggleOrderExpand,
    toggleOrderFavorite,
    toggleFavoritesOnly,
    navigateToCreate,
    navigateToModify,
    goBack,
    reorder 
} from './orders.actions.js';

// Componenti riutilizzabili
import { renderTopBar } from '../../components/topbar/topbar.component.js';
import { renderSidebar } from '../../components/sidebar/sidebar.component.js';
import { renderWeekScheduler } from '../../components/weekScheduler/weekScheduler.component.js';

// Utilities
import { safeInnerHTML } from '../../utils/dom.js';

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

/**
 * Render completo pagina Orders
 * 
 * WORKFLOW:
 * 1. Legge ordersState
 * 2. Chiama component renderers con container + props + callbacks
 * 3. Ogni componente gestisce il proprio DOM
 * 
 * IDEMPOTENTE: Può essere chiamata N volte.
 * Ogni render rimpiazza il contenuto precedente.
 */
export function renderOrdersPage() {
    console.log('[RenderOrders] Rendering complete orders UI...');

    // 1. TopBar
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

    // 2. Sidebar
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

    // 3. Week Scheduler
    renderScheduler();

    // 4. Active Orders Section
    renderActiveOrdersSection();

    // 5. Recent Orders Section
    renderRecentOrdersSection();

    console.log('[RenderOrders] Complete orders UI rendered successfully');
}

// ============================================================================
// SIDEBAR & TOPBAR RENDER (per azioni isolate)
// ============================================================================

/**
 * Render solo Sidebar e TopBar
 * 
 * Usato quando solo lo stato sidebar cambia.
 */
export function renderSidebarAndTopbar() {
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

// ============================================================================
// SCHEDULER RENDER
// ============================================================================

/**
 * Render Week Scheduler
 */
export function renderScheduler() {
    renderWeekScheduler(
        ordersView.refs.schedulerSection,
        {
            monthLabel: ordersState.monthLabel,
            weekDays: ordersState.weekDays,
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
 * LOGICA:
 * - Se activeOrders.length === 0 → empty state
 * - Se activeOrders.length > 0 → carosello orizzontale
 */
export function renderActiveOrdersSection() {
    const container = ordersView.refs.activeOrdersContainer;
    
    if (!container) {
        console.warn('[RenderOrders] activeOrdersContainer is null');
        return;
    }

    const { activeOrders, expandedOrderIds, loading } = ordersState;

    // Loading state
    if (loading) {
        safeInnerHTML(container, renderActiveOrdersLoading());
        return;
    }

    // Empty state
    if (activeOrders.length === 0) {
        safeInnerHTML(container, renderActiveOrdersEmpty());
        // Event listener per Order Now button
        const orderNowBtn = container.querySelector('[data-action="order-now"]');
        if (orderNowBtn) {
            orderNowBtn.addEventListener('click', () => navigateToCreate());
        }
        return;
    }

    // Populated state: carosello
    safeInnerHTML(container, renderActiveOrdersCarousel(activeOrders, expandedOrderIds));

    // Event delegation per azioni nelle card
    container.addEventListener('click', handleActiveOrderClick);

    console.log(`[RenderOrders] Active orders rendered: ${activeOrders.length}`);
}

/**
 * Render loading state per active orders
 */
function renderActiveOrdersLoading() {
    return `
        <div class="h-[180px] w-full bg-slate-100 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center animate-pulse">
            <span class="material-symbols-outlined text-slate-400 text-4xl animate-spin">sync</span>
        </div>
    `;
}

/**
 * Render empty state per active orders
 * 
 * ACCESSIBILITÀ:
 * - aria-label sul bottone per screen reader
 * - Icona decorativa con aria-hidden
 */
function renderActiveOrdersEmpty() {
    // ACCESSIBILITÀ: L'icona è decorativa, quindi ha aria-hidden="true"
    // Il bottone ha un aria-label esplicito per screen reader
    return `
        <div class="h-[180px] w-full bg-slate-100 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center">
            <div class="mb-4">
                <span class="material-symbols-outlined text-slate-400 dark:text-slate-600 text-4xl" aria-hidden="true">shopping_basket</span>
            </div>
            <p class="text-slate-600 dark:text-slate-400 text-sm font-medium mb-4">Hungry? No active orders for today.</p>
            <button 
                class="w-full max-w-xs bg-primary text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                data-action="order-now"
                aria-label="Create a new order"
            >
                <span class="material-symbols-outlined text-sm" aria-hidden="true">add</span>
                Order Now
            </button>
        </div>
    `;
}

/**
 * Render carosello ordini attivi
 * 
 * ACCESSIBILITÀ:
 * - role="list" sul container
 * - role="listitem" su ogni card
 * - Navigabile via tastiera con scroll-snap
 * 
 * @param {Array} orders - Array di ordini attivi
 * @param {Array} expandedIds - IDs degli ordini espansi
 */
function renderActiveOrdersCarousel(orders, expandedIds) {
    // ACCESSIBILITÀ: role="list" e aria-label per indicare il contenuto del carosello
    let html = `
        <div 
            class="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-5 px-5 hide-scrollbar"
            role="list"
            aria-label="Your active orders for today"
        >
    `;

    orders.forEach(order => {
        const isExpanded = expandedIds.includes(order.id);
        html += renderActiveOrderCard(order, isExpanded);
    });

    html += '</div>';
    return html;
}

/**
 * Render singola card ordine attivo
 * 
 * ACCESSIBILITÀ:
 * - role="listitem" sulla card
 * - aria-expanded per show more/less
 * - Badge stato non dipende solo dal colore (ha testo)
 * 
 * @param {Object} order - Dati ordine
 * @param {boolean} isExpanded - Se la card è espansa
 */
function renderActiveOrderCard(order, isExpanded) {
    const { id, status, time_slot, is_modifiable, ingredients, is_favorite, order_number, image_url } = order;
    
    // Status badge styling
    const statusColors = getStatusColors(status);
    const statusLabel = status.toUpperCase();
    
    // Ingredienti preview vs full
    const previewCount = 3;
    const ingredientsToShow = isExpanded ? ingredients : ingredients.slice(0, previewCount);
    const hasMore = ingredients.length > previewCount;
    
    // ACCESSIBILITÀ: role="listitem" per la card nel carosello
    // ACCESSIBILITÀ: aria-expanded indica lo stato di espansione
    return `
        <div 
            class="flex-shrink-0 w-[280px] snap-start bg-white dark:bg-card-dark rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm"
            role="listitem"
            data-order-id="${id}"
        >
            <!-- Header: Status + Time -->
            <div class="flex justify-between items-center mb-3">
                <span class="px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text} text-[9px] font-bold uppercase tracking-widest">
                    ${statusLabel}
                </span>
                <span class="text-[9px] font-medium text-slate-400">${time_slot || ''}</span>
            </div>
            
            <!-- Image + Content -->
            <div class="flex gap-3 items-start mb-3">
                <div class="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0">
                    ${image_url 
                        ? `<img src="${image_url}" alt="Sandwich" class="w-full h-full object-cover">`
                        : `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-slate-400" aria-hidden="true">lunch_dining</span></div>`
                    }
                </div>
                <div class="flex-grow">
                    <div class="flex justify-between items-start">
                        <span class="text-xs font-mono text-slate-500">#${order_number || id}</span>
                        <!-- Favorite Star -->
                        <button 
                            class="p-1 ${is_favorite ? 'text-amber-400' : 'text-slate-400'} hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            data-action="toggle-favorite"
                            data-order-id="${id}"
                            data-config-id="${order.ingredient_configuration_id}"
                            aria-label="${is_favorite ? 'Remove from favorites' : 'Add to favorites'}"
                            aria-pressed="${is_favorite}"
                        >
                            <span class="material-symbols-outlined text-lg" aria-hidden="true">${is_favorite ? 'star' : 'star_outline'}</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Ingredients -->
            <div class="mb-3">
                <div class="flex flex-wrap gap-1">
                    ${ingredientsToShow.map(ing => `
                        <span class="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                            ${ing.name}
                        </span>
                    `).join('')}
                </div>
                ${hasMore ? `
                    <button 
                        class="text-[10px] text-primary mt-2 flex items-center gap-0.5 focus:outline-none focus-visible:underline"
                        data-action="toggle-expand"
                        data-order-id="${id}"
                        aria-expanded="${isExpanded}"
                        aria-label="${isExpanded ? 'Show less ingredients' : 'Show all ingredients'}"
                    >
                        ${isExpanded ? 'Show less' : `Show more (+${ingredients.length - previewCount})`}
                        <span class="material-symbols-outlined text-xs" aria-hidden="true">${isExpanded ? 'expand_less' : 'expand_more'}</span>
                    </button>
                ` : ''}
            </div>
            
            <!-- Action: Modify (solo se pending) -->
            ${is_modifiable ? `
                <button 
                    class="w-full bg-primary/10 text-primary text-[10px] font-bold uppercase py-2 px-4 rounded-lg flex items-center justify-center gap-1 active:bg-primary active:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-action="modify-order"
                    data-order-id="${id}"
                    aria-label="Modify this order"
                >
                    <span class="material-symbols-outlined text-xs" aria-hidden="true">edit</span>
                    Modify Order
                </button>
            ` : ''}
        </div>
    `;
}

/**
 * Handler per click su active orders
 */
function handleActiveOrderClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const orderId = parseInt(target.dataset.orderId, 10);

    switch (action) {
        case 'toggle-expand':
            toggleOrderExpand(orderId);
            break;
        case 'toggle-favorite':
            const configId = parseInt(target.dataset.configId, 10);
            toggleOrderFavorite(orderId, configId);
            break;
        case 'modify-order':
            navigateToModify(orderId);
            break;
    }
}

// ============================================================================
// RECENT ORDERS SECTION RENDER
// ============================================================================

/**
 * Render sezione Recent Orders
 */
export function renderRecentOrdersSection() {
    const container = ordersView.refs.recentOrdersList;
    const headerContainer = ordersView.refs.recentOrdersHeader;
    
    if (!container) {
        console.warn('[RenderOrders] recentOrdersList is null');
        return;
    }

    const { recentOrders, expandedOrderIds, showOnlyFavorites } = ordersState;

    // Filtra per preferiti se richiesto
    const ordersToShow = showOnlyFavorites 
        ? recentOrders.filter(o => o.is_favorite)
        : recentOrders;

    // Render header con toggle preferiti
    if (headerContainer) {
        safeInnerHTML(headerContainer, renderRecentOrdersHeader(showOnlyFavorites));
        
        // Event listener per toggle preferiti
        const favToggle = headerContainer.querySelector('[data-action="toggle-favorites-filter"]');
        if (favToggle) {
            favToggle.addEventListener('click', () => toggleFavoritesOnly());
        }
    }

    // Empty state
    if (ordersToShow.length === 0) {
        safeInnerHTML(container, renderRecentOrdersEmpty(showOnlyFavorites));
        return;
    }

    // Lista ordini
    let html = '<div class="space-y-4">';
    ordersToShow.forEach(order => {
        const isExpanded = expandedOrderIds.includes(order.id);
        html += renderRecentOrderCard(order, isExpanded);
    });
    html += '</div>';

    safeInnerHTML(container, html);

    // Event delegation per azioni nelle card
    container.addEventListener('click', handleRecentOrderClick);

    console.log(`[RenderOrders] Recent orders rendered: ${ordersToShow.length}`);
}

/**
 * Render header sezione Recent Orders
 * 
 * @param {boolean} favoritesActive - Se filtro preferiti è attivo
 */
function renderRecentOrdersHeader(favoritesActive) {
    // ACCESSIBILITÀ: aria-pressed indica lo stato del toggle
    return `
        <div class="flex justify-between items-center">
            <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Recently Ordered
            </h2>
            <button 
                class="p-1.5 rounded-lg ${favoritesActive ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500' : 'text-slate-400 hover:text-slate-600'} transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                data-action="toggle-favorites-filter"
                aria-label="${favoritesActive ? 'Show all orders' : 'Show only favorites'}"
                aria-pressed="${favoritesActive}"
            >
                <span class="material-symbols-outlined text-lg" aria-hidden="true">${favoritesActive ? 'star' : 'star_outline'}</span>
            </button>
        </div>
    `;
}

/**
 * Render empty state per recent orders
 * 
 * @param {boolean} favoritesActive - Se filtro preferiti è attivo
 */
function renderRecentOrdersEmpty(favoritesActive) {
    const message = favoritesActive 
        ? 'No favorite orders yet. Star an order to add it here!'
        : 'No recent orders yet.';

    return `
        <div class="py-8 text-center">
            <span class="material-symbols-outlined text-slate-400 text-4xl mb-2" aria-hidden="true">receipt_long</span>
            <p class="text-slate-500 text-sm">${message}</p>
        </div>
    `;
}

/**
 * Render singola card ordine recente
 * 
 * ACCESSIBILITÀ:
 * - Bottone reorder con aria-label
 * - Stella preferiti con aria-pressed
 * 
 * @param {Object} order - Dati ordine
 * @param {boolean} isExpanded - Se la card è espansa
 */
function renderRecentOrderCard(order, isExpanded) {
    const { id, date, time_slot, ingredients, is_favorite, order_number, image_url, ingredient_configuration_id } = order;
    
    // Ingredienti preview vs full
    const previewCount = 2;
    const ingredientsToShow = isExpanded ? ingredients : ingredients.slice(0, previewCount);
    const hasMore = ingredients.length > previewCount;
    
    // Formatta data
    const dateLabel = formatOrderDate(date);

    return `
        <div class="bg-white dark:bg-card-dark rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4" data-order-id="${id}">
            <!-- Image -->
            <div class="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800">
                ${image_url 
                    ? `<img src="${image_url}" alt="Sandwich" class="w-full h-full object-cover">`
                    : `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-slate-400" aria-hidden="true">lunch_dining</span></div>`
                }
            </div>
            
            <!-- Content -->
            <div class="flex-grow flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="text-xs font-mono text-slate-500">#${order_number || id}</span>
                            <p class="text-[10px] text-slate-400 mt-0.5">${dateLabel} • ${time_slot || ''}</p>
                        </div>
                        <!-- Favorite Star -->
                        <button 
                            class="p-1 ${is_favorite ? 'text-amber-400' : 'text-slate-400'} hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            data-action="toggle-favorite"
                            data-order-id="${id}"
                            data-config-id="${ingredient_configuration_id}"
                            aria-label="${is_favorite ? 'Remove from favorites' : 'Add to favorites'}"
                            aria-pressed="${is_favorite}"
                        >
                            <span class="material-symbols-outlined text-lg" aria-hidden="true">${is_favorite ? 'star' : 'star_outline'}</span>
                        </button>
                    </div>
                    
                    <!-- Ingredients Preview -->
                    <div class="flex flex-wrap gap-1 mt-2">
                        ${ingredientsToShow.map(ing => `
                            <span class="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                                ${ing.name}
                            </span>
                        `).join('')}
                        ${hasMore && !isExpanded ? `
                            <button 
                                class="text-[9px] text-primary focus:outline-none focus-visible:underline"
                                data-action="toggle-expand"
                                data-order-id="${id}"
                                aria-expanded="false"
                            >
                                +${ingredients.length - previewCount} more
                            </button>
                        ` : ''}
                    </div>
                    ${isExpanded && hasMore ? `
                        <button 
                            class="text-[9px] text-primary mt-1 focus:outline-none focus-visible:underline"
                            data-action="toggle-expand"
                            data-order-id="${id}"
                            aria-expanded="true"
                        >
                            Show less
                        </button>
                    ` : ''}
                </div>
                
                <!-- Reorder Button -->
                <div class="flex justify-end mt-2">
                    <button 
                        class="bg-primary/10 text-primary text-[10px] font-bold uppercase py-1.5 px-3 rounded-lg flex items-center gap-1 active:bg-primary active:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        data-action="reorder"
                        data-config-id="${ingredient_configuration_id}"
                        aria-label="Reorder this sandwich"
                    >
                        <span class="material-symbols-outlined text-xs" aria-hidden="true">refresh</span>
                        Reorder
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Handler per click su recent orders
 */
function handleRecentOrderClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    const orderId = parseInt(target.dataset.orderId, 10);

    switch (action) {
        case 'toggle-expand':
            toggleOrderExpand(orderId);
            break;
        case 'toggle-favorite':
            const configId = parseInt(target.dataset.configId, 10);
            toggleOrderFavorite(orderId, configId);
            break;
        case 'reorder':
            const reorderConfigId = parseInt(target.dataset.configId, 10);
            reorder(reorderConfigId);
            break;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ritorna classi colori per status ordine
 * 
 * @param {string} status - Status dell'ordine
 * @returns {Object} - { bg, text }
 */
function getStatusColors(status) {
    const colors = {
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
        confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
        ready: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
        picked_up: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
        rejected: { bg: 'bg-rose-500/10', text: 'text-rose-500' },
    };
    return colors[status] || colors.pending;
}

/**
 * Formatta data ordine per visualizzazione
 * 
 * @param {string} dateStr - Data in formato YYYY-MM-DD
 * @returns {string} - Data formattata (es. "Jan 15")
 */
function formatOrderDate(dateStr) {
    if (!dateStr) return '';
    
    try {
        const date = new Date(dateStr);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    } catch {
        return dateStr;
    }
}

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
