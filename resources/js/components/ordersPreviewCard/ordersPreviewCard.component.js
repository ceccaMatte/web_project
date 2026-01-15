/**
 * ORDERS PREVIEW CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza card preview ordini
 * - Varianti: login-cta, empty, single, multi
 * 
 * PROPS:
 * - variant: 'login-cta' | 'empty' | 'single' | 'multi'
 * - ordersCount: number
 * - selectedOrder: {id, status, statusLabel} | null
 * 
 * CALLBACKS: nessuno (usano href)
 */

import { icons, labels, colors, a11y } from '../../config/ui.config.js';
import { safeInnerHTML } from '../../utils/dom.js';

export function renderOrdersPreviewCard(container, props) {
    if (!container) return;

    const { variant, ordersCount, selectedOrder } = props;

    const statusColors = colors.status;
    
    const getHref = () => {
        if (variant === 'login-cta') return '/login';
        if (variant === 'empty') return '/orders/create';
        return '/orders';
    };

    const getAriaLabel = () => {
        switch (variant) {
            case 'login-cta': return a11y.orders.login;
            case 'empty': return a11y.orders.empty;
            case 'single': return a11y.orders.single(selectedOrder?.id, selectedOrder?.statusLabel);
            case 'multi': return a11y.orders.multi(ordersCount, selectedOrder?.id, selectedOrder?.statusLabel);
            default: return '';
        }
    };

    let html = '';
    const href = getHref();
    const ariaLabel = getAriaLabel();

    if (variant === 'login-cta') {
        html = `
            <a href="${href}" class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform rounded-xl" aria-label="${ariaLabel}">
                <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
                    <div class="flex items-center gap-3">
                        <div class="size-11 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary">${icons.login}</span>
                        </div>
                        <div>
                            <p class="text-white text-sm font-bold">${labels.orders.login_cta}</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-slate-400">${icons.chevron_right}</span>
                </div>
            </a>
        `;
    } else if (variant === 'empty') {
        html = `
            <a href="${href}" class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform rounded-xl" aria-label="${ariaLabel}">
                <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
                    <div class="flex items-center gap-3">
                        <div class="size-11 rounded-lg bg-slate-500/10 flex items-center justify-center">
                            <span class="material-symbols-outlined text-slate-400">${icons.add_circle}</span>
                        </div>
                        <div>
                            <p class="text-slate-400 text-sm font-medium">${labels.orders.no_orders}</p>
                            <p class="text-primary text-xs font-bold mt-0.5">${labels.orders.book_sandwich}</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-slate-400">${icons.chevron_right}</span>
                </div>
            </a>
        `;
    } else if (variant === 'single' && selectedOrder) {
        const colorSet = statusColors[selectedOrder.status] || statusColors.pending;
        const pulseClass = selectedOrder.status === 'ready' ? 'animate-pulse' : '';
        html = `
            <a href="${href}" class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform rounded-xl" aria-label="${ariaLabel}">
                <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
                    <div class="flex items-center gap-3">
                        <div class="size-11 rounded-lg ${colorSet.bg} flex items-center justify-center">
                            <span class="material-symbols-outlined ${colorSet.text}">${icons.receipt}</span>
                        </div>
                        <div>
                            <p class="text-white text-sm font-bold">${labels.orders.order_id(selectedOrder.id)}</p>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <span class="size-1.5 rounded-full ${colorSet.dot} ${pulseClass}"></span>
                                <p class="${colorSet.text} text-[10px] font-bold uppercase tracking-wider">${selectedOrder.statusLabel}</p>
                            </div>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-slate-400">${icons.chevron_right}</span>
                </div>
            </a>
        `;
    } else if (variant === 'multi' && selectedOrder) {
        const colorSet = statusColors[selectedOrder.status] || statusColors.pending;
        const pulseClass = selectedOrder.status === 'ready' ? 'animate-pulse' : '';
        html = `
            <a href="${href}" class="block relative h-[92px] w-full cursor-pointer active:scale-[0.98] transition-transform rounded-xl" aria-label="${ariaLabel}">
                <div class="absolute inset-0 top-4 mx-4 h-full rounded-xl border border-border-dark/30 bg-surface-dark/40 scale-[0.92] opacity-40 z-0"></div>
                <div class="absolute inset-0 top-2 mx-2 h-full rounded-xl border border-border-dark/60 bg-surface-dark/80 scale-[0.96] opacity-70 z-10"></div>
                <div class="relative z-20 h-full p-4 rounded-xl border border-border-dark bg-surface-dark flex items-center justify-between shadow-2xl">
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <div class="size-11 rounded-lg ${colorSet.bg} flex items-center justify-center">
                                <span class="material-symbols-outlined ${colorSet.text}">${icons.receipt}</span>
                            </div>
                            <div class="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-surface-dark shadow-lg min-w-[20px] text-center">${ordersCount}</div>
                        </div>
                        <div>
                            <p class="text-white text-sm font-bold">${labels.orders.order_id(selectedOrder.id)}</p>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <span class="size-1.5 rounded-full ${colorSet.dot} ${pulseClass}"></span>
                                <p class="${colorSet.text} text-[10px] font-bold uppercase tracking-wider">${selectedOrder.statusLabel}</p>
                            </div>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-slate-400">${icons.chevron_right}</span>
                </div>
            </a>
        `;
    }

    safeInnerHTML(container, html);
    console.log(`[OrdersPreviewCard] Rendered (${variant})`);
}

export default { renderOrdersPreviewCard };
