/**
 * ACTIVE ORDERS CAROUSEL COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Render carosello con 3 card: prev, active, next
 * - Gestione scroll-snap e navigazione
 * 
 * REFERENCE DESIGN:
 * <div class="carousel-track">
 *   <div class="carousel-card carousel-card-side carousel-offset-left">...</div>
 *   <div class="carousel-card carousel-card-active">...</div>
 *   <div class="carousel-card carousel-card-side carousel-offset-right">...</div>
 * </div>
 * 
 * PROPS:
 * - orders: Array<Order> - tutti gli ordini attivi
 * - activeIndex: number - indice ordine attivo nel carousel
 * - expandedOrderIds: Array<number> - IDs ordini espansi
 * - labels: { showMore, showLess, modify }
 * - statusColors: { pending: { bg, text }, ... }
 * - statusLabels: { pending: 'PENDING', ... }
 * 
 * CALLBACKS:
 * - onToggleExpand: (orderId) => void
 * - onModify: (orderId) => void
 * - onNavigate: (direction: 'prev' | 'next') => void
 * 
 * LOGICA:
 * - Se orders.length === 1: solo card active, no side
 * - Se orders.length >= 2: prev (o null) + active + next (o null)
 * - activeIndex wrap-around: se vai oltre l'ultimo, torni al primo
 */

import { buildActiveOrderCardHTML } from '../activeOrderCard/activeOrderCard.component.js';
import { safeInnerHTML } from '../../utils/dom.js';

let cleanupListener = null;
let cleanupTouchListeners = null;

/**
 * Render activeOrdersCarousel component
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} props - Carousel props
 * @param {Object} callbacks - Event callbacks
 */
export function renderActiveOrdersCarousel(container, props, callbacks) {
    if (!container) return;

    const { orders, activeIndex, expandedOrderIds, labels, statusColors, statusLabels } = props;
    const { onToggleExpand, onModify, onNavigate } = callbacks;

    // No orders → empty (handled by parent)
    if (!orders || orders.length === 0) {
        safeInnerHTML(container, '');
        return;
    }

    const count = orders.length;
    
    // Calculate indices with wrap-around
    const prevIndex = count > 1 ? (activeIndex - 1 + count) % count : null;
    const nextIndex = count > 1 ? (activeIndex + 1) % count : null;

    // Build HTML
    let html = `
        <div 
            class="carousel-track relative flex items-center justify-center gap-3 py-4"
            role="region"
            aria-label="Your active orders carousel"
        >
    `;

    // Prev card (side left)
    if (prevIndex !== null) {
        const prevOrder = orders[prevIndex];
        html += `
            <div class="carousel-offset-left cursor-pointer" data-action="navigate" data-direction="prev">
                ${buildActiveOrderCardHTML({
                    order: prevOrder,
                    mode: 'side',
                    isExpanded: false,
                    statusLabel: statusLabels[prevOrder.status] || prevOrder.status.toUpperCase(),
                    statusColors: statusColors[prevOrder.status] || statusColors.pending,
                    labels
                }, {})}
            </div>
        `;
    }

    // Active card (center)
    const activeOrder = orders[activeIndex];
    const isActiveExpanded = expandedOrderIds.includes(activeOrder.id);
    html += buildActiveOrderCardHTML({
        order: activeOrder,
        mode: 'active',
        isExpanded: isActiveExpanded,
        statusLabel: statusLabels[activeOrder.status] || activeOrder.status.toUpperCase(),
        statusColors: statusColors[activeOrder.status] || statusColors.pending,
        showMoreLabel: labels.showMore,
        showLessLabel: labels.showLess,
        modifyLabel: labels.modify
    }, {});

    // Next card (side right)
    if (nextIndex !== null) {
        const nextOrder = orders[nextIndex];
        html += `
            <div class="carousel-offset-right cursor-pointer" data-action="navigate" data-direction="next">
                ${buildActiveOrderCardHTML({
                    order: nextOrder,
                    mode: 'side',
                    isExpanded: false,
                    statusLabel: statusLabels[nextOrder.status] || nextOrder.status.toUpperCase(),
                    statusColors: statusColors[nextOrder.status] || statusColors.pending,
                    labels
                }, {})}
            </div>
        `;
    }

    html += '</div>';

    // Dots indicator (se più di 1 ordine)
    if (count > 1) {
        html += `
            <div class="flex justify-center gap-1.5 mt-2" role="tablist" aria-label="Carousel navigation">
                ${orders.map((_, idx) => `
                    <button 
                        class="w-1.5 h-1.5 rounded-full transition-all ${idx === activeIndex ? 'bg-primary w-4' : 'bg-slate-300 dark:bg-slate-700'}"
                        data-action="go-to-index"
                        data-index="${idx}"
                        role="tab"
                        aria-selected="${idx === activeIndex}"
                        aria-label="Go to order ${idx + 1}"
                    ></button>
                `).join('')}
            </div>
        `;
    }

    safeInnerHTML(container, html);

    // Cleanup previous listener
    if (cleanupListener) {
        cleanupListener();
        cleanupListener = null;
    }

    // Event delegation
    const handleClick = (e) => {
        const navigateTarget = e.target.closest('[data-action="navigate"]');
        if (navigateTarget && onNavigate) {
            const direction = navigateTarget.dataset.direction;
            onNavigate(direction);
            return;
        }

        const goToTarget = e.target.closest('[data-action="go-to-index"]');
        if (goToTarget && onNavigate) {
            const targetIndex = parseInt(goToTarget.dataset.index, 10);
            // Calculate direction based on target
            if (targetIndex > activeIndex) {
                for (let i = 0; i < targetIndex - activeIndex; i++) {
                    onNavigate('next');
                }
            } else if (targetIndex < activeIndex) {
                for (let i = 0; i < activeIndex - targetIndex; i++) {
                    onNavigate('prev');
                }
            }
            return;
        }

        const expandTarget = e.target.closest('[data-action="toggle-expand"]');
        if (expandTarget && onToggleExpand) {
            const orderId = parseInt(expandTarget.dataset.orderId, 10);
            onToggleExpand(orderId);
            return;
        }

        const modifyTarget = e.target.closest('[data-action="modify-order"]');
        if (modifyTarget && onModify) {
            const orderId = parseInt(modifyTarget.dataset.orderId, 10);
            onModify(orderId);
            return;
        }
    };

    container.addEventListener('click', handleClick);
    cleanupListener = () => container.removeEventListener('click', handleClick);

    // Touch swipe support
    if (cleanupTouchListeners) {
        cleanupTouchListeners();
        cleanupTouchListeners = null;
    }

    const carouselTrack = container.querySelector('.carousel-track');
    if (carouselTrack && count > 1 && onNavigate) {
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50; // Minimum swipe distance in pixels

        const handleTouchStart = (e) => {
            touchStartX = e.changedTouches[0].screenX;
        };

        const handleTouchEnd = (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const swipeDistance = touchEndX - touchStartX;

            if (Math.abs(swipeDistance) >= minSwipeDistance) {
                if (swipeDistance > 0) {
                    // Swiped right → go to previous
                    onNavigate('prev');
                } else {
                    // Swiped left → go to next
                    onNavigate('next');
                }
            }
        };

        carouselTrack.addEventListener('touchstart', handleTouchStart, { passive: true });
        carouselTrack.addEventListener('touchend', handleTouchEnd, { passive: true });

        cleanupTouchListeners = () => {
            carouselTrack.removeEventListener('touchstart', handleTouchStart);
            carouselTrack.removeEventListener('touchend', handleTouchEnd);
        };
    }
}

export default { renderActiveOrdersCarousel };
