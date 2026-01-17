/**
 * RECENT ORDERS SECTION COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Sezione "Recently Ordered"
 * - Header con titolo + toggle preferiti
 * - Lista scrollabile raggruppata per giorno
 * 
 * REFERENCE DESIGN:
 * <section class="px-5 pt-2 flex-grow overflow-hidden flex flex-col">
 *   <div class="flex justify-between items-center mb-3">
 *     <h2>Recently Ordered</h2>
 *     <button>star filter</button>
 *   </div>
 *   <div class="space-y-4 overflow-y-auto flex-grow pb-10 hide-scrollbar">
 *     <!-- day groups -->
 *   </div>
 * </section>
 * 
 * PROPS:
 * - orders: Array<Order>
 * - ordersGroupedByDay: Array<{ dayLabel, orders }> (già raggruppati)
 * - expandedOrderIds: Array<number>
 * - showOnlyFavorites: boolean
 * - labels: { sectionTitle, showMore, showLess, reorder, noRecent, favoritesOnly }
 * - icons: { favorite, favoriteOutline }
 * 
 * CALLBACKS:
 * - onToggleExpand: (orderId) => void
 * - onToggleFavorite: (orderId, configId) => void
 * - onReorder: (configId) => void
 * - onToggleFavoritesFilter: () => void
 */

import { buildRecentOrdersDayGroupHTML } from '../recentOrdersDayGroup/recentOrdersDayGroup.component.js';
import { safeInnerHTML } from '../../utils/dom.js';

let cleanupListener = null;

/**
 * Render recentOrdersSection component
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} props - Section props
 * @param {Object} callbacks - Event callbacks
 */
export function renderRecentOrdersSection(container, props, callbacks) {
    if (!container) return;

    const { ordersGroupedByDay, expandedOrderIds, showOnlyFavorites, labels, icons } = props;
    const { onToggleExpand, onToggleFavorite, onReorder, onToggleFavoritesFilter } = callbacks;

    // Header
    const headerHTML = `
        <div class="flex justify-between items-center mb-3">
            <h2 class="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em]">${labels.sectionTitle}</h2>
            <button 
                class="w-7 h-7 flex items-center justify-center rounded-lg  bg-slate-800 ${showOnlyFavorites ? 'text-yellow-500' : 'text-slate-400'} border border-slate-700/50 hover:scale-105 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                data-action="toggle-favorites-filter"
                aria-label="${showOnlyFavorites ? 'Show all orders' : 'Show only favorites'}"
                aria-pressed="${showOnlyFavorites}"
            >
                <span 
                    class="material-symbols-outlined text-base" 
                    aria-hidden="true"
                    ${showOnlyFavorites ? 'style="font-variation-settings: \'FILL\' 1, \'wght\' 400, \'GRAD\' 0, \'opsz\' 24;"' : ''}
                >${showOnlyFavorites ? icons.favorite : icons.favoriteOutline}</span>
            </button>
        </div>
    `;

    // Content
    let contentHTML = '';

    if (!ordersGroupedByDay || ordersGroupedByDay.length === 0) {
        // Empty state
        const message = showOnlyFavorites 
            ? 'No favorite orders yet. Star an order to add it here!'
            : labels.noRecent;

        contentHTML = `
            <div class="py-8 text-center">
                <span class="material-symbols-outlined text-slate-400 text-4xl mb-2" aria-hidden="true">receipt_long</span>
                <p class="text-slate-500 text-sm">${message}</p>
            </div>
        `;
    } else {
        // Day groups
        ordersGroupedByDay.forEach(group => {
            contentHTML += buildRecentOrdersDayGroupHTML({
                dayLabel: group.dayLabel,
                orders: group.orders,
                expandedOrderIds,
                labels: {
                    showMore: labels.showMore,
                    showLess: labels.showLess,
                    reorder: labels.reorder
                }
            });
        });
    }

    const html = `
        <section class="pt-2 flex-grow overflow-hidden flex flex-col md:max-w-[500px]" aria-label="Your recent orders history" role="region">
            ${headerHTML}
            <div class="space-y-4 overflow-y-auto flex-grow pb-10 hide-scrollbar">
                ${contentHTML}
            </div>
        </section>
    `;

    safeInnerHTML(container, html);

    // Cleanup previous listener
    if (cleanupListener) {
        cleanupListener();
        cleanupListener = null;
    }

    // Event delegation
    const handleClick = (e) => {
        const filterTarget = e.target.closest('[data-action="toggle-favorites-filter"]');
        if (filterTarget && onToggleFavoritesFilter) {
            onToggleFavoritesFilter();
            return;
        }

        const expandTarget = e.target.closest('[data-action="toggle-expand"]');
        if (expandTarget && onToggleExpand) {
            const orderId = parseInt(expandTarget.dataset.orderId, 10);
            onToggleExpand(orderId);
            return;
        }

        const favoriteTarget = e.target.closest('[data-action="toggle-favorite"]');
        if (favoriteTarget && onToggleFavorite) {
            const orderId = parseInt(favoriteTarget.dataset.orderId, 10);
            const configId = favoriteTarget.dataset.configId;
            onToggleFavorite(orderId, configId);
            return;
        }

        const reorderTarget = e.target.closest('[data-action="reorder"]');
        if (reorderTarget && onReorder) {
            const orderId = parseInt(reorderTarget.dataset.orderId, 10);
            onReorder(orderId);
            return;
        }
    };

    container.addEventListener('click', handleClick);
    cleanupListener = () => container.removeEventListener('click', handleClick);
}

export default { renderRecentOrdersSection };
