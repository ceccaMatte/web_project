/**
 * RECENT ORDERS DAY GROUP COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Raggruppamento ordini per giorno
 * - Badge giorno + linea divisoria + lista card
 * 
 * REFERENCE DESIGN:
 * <div>
 *   <div class="flex items-center gap-3 mb-3">
 *     <span class="text-[8px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">TUE 12</span>
 *     <div class="h-[1px] flex-grow bg-slate-100"></div>
 *   </div>
 *   <div class="space-y-3">
 *     <!-- cards -->
 *   </div>
 * </div>
 * 
 * PROPS:
 * - dayLabel: string (es. "TUE 12")
 * - orders: Array<Order>
 * - expandedOrderIds: Array<number>
 * - labels: { showMore, showLess, reorder }
 * 
 * RETURNS:
 * - HTML string (non monta direttamente, usato da parent)
 */

import { buildRecentOrderCardHTML } from '../recentOrderCard/recentOrderCard.component.js';

/**
 * Build HTML for day group
 * 
 * @param {Object} props - Group props
 * @returns {string} - HTML string
 */
export function buildRecentOrdersDayGroupHTML(props) {
    const { dayLabel, orders, expandedOrderIds, labels } = props;

    let cardsHTML = '';
    orders.forEach(order => {
        const isExpanded = expandedOrderIds.includes(order.id);
        cardsHTML += buildRecentOrderCardHTML({
            order,
            isExpanded,
            dateLabel: dayLabel,
            labels
        });
    });

    return `
        <div class="mb-6">
            <div class="flex items-center gap-3 mb-3">
                <span class="text-[8px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">${dayLabel}</span>
                <div class="h-[1px] flex-grow bg-slate-100 dark:bg-slate-800"></div>
            </div>
            <div class="space-y-3">
                ${cardsHTML}
            </div>
        </div>
    `;
}

export default { buildRecentOrdersDayGroupHTML };
