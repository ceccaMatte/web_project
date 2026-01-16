/**
 * ACTIVE ORDERS SECTION COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Sezione wrapper per Active Orders
 * - Decide se mostrare empty state o carousel
 * - Titolo sezione opzionale
 * 
 * PROPS:
 * - orders: Array<Order>
 * - activeIndex: number
 * - expandedOrderIds: Array<number>
 * - labels: { sectionTitle, showMore, showLess, modify, emptyMessage, orderNowCta }
 * - statusColors: { pending: { bg, text }, ... }
 * - statusLabels: { pending: 'PENDING', ... }
 * - icons: { empty, add }
 * - loading: boolean
 * 
 * CALLBACKS:
 * - onToggleExpand: (orderId) => void
 * - onModify: (orderId) => void
 * - onNavigate: (direction) => void
 * - onOrderNow: () => void
 */

import { renderActiveOrdersCarousel } from '../activeOrdersCarousel/activeOrdersCarousel.component.js';
import { renderEmptyStateCard } from '../emptyStateCard/emptyStateCard.component.js';
import { safeInnerHTML } from '../../utils/dom.js';

/**
 * Render activeOrdersSection component
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} props - Section props
 * @param {Object} callbacks - Event callbacks
 */
export function renderActiveOrdersSection(container, props, callbacks) {
    if (!container) return;

    const { orders, activeIndex, expandedOrderIds, labels, statusColors, statusLabels, icons, loading } = props;
    const { onToggleExpand, onModify, onNavigate, onOrderNow } = callbacks;

    // Loading state
    if (loading) {
        safeInnerHTML(container, `
            <div class="h-[180px] w-full bg-slate-100 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center animate-pulse">
                <span class="material-symbols-outlined text-slate-400 text-4xl animate-spin" aria-hidden="true">sync</span>
            </div>
        `);
        return;
    }

    // Empty state
    if (!orders || orders.length === 0) {
        renderEmptyStateCard(container, {
            icon: icons.empty,
            message: labels.emptyMessage,
            ctaLabel: labels.orderNowCta,
            ctaIcon: icons.add
        }, {
            onCtaClick: onOrderNow
        });
        return;
    }

    // Carousel
    renderActiveOrdersCarousel(container, {
        orders,
        activeIndex,
        expandedOrderIds,
        labels: {
            showMore: labels.showMore,
            showLess: labels.showLess,
            modify: labels.modify
        },
        statusColors,
        statusLabels
    }, {
        onToggleExpand,
        onModify,
        onNavigate
    });
}

export default { renderActiveOrdersSection };
