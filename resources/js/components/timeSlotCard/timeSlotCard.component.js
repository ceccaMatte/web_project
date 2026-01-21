/**
 * TIME SLOT CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Renderizza singolo slot temporale prenotabile
 * - Varianti: home (con slots left), order-edit (selected/full/available)
 * - Accessibilità completa
 * 
 * PROPS:
 * - id: number
 * - timeLabel: string
 * - slotsLeft: number
 * - href: string
 * - isDisabled: boolean
 * - variant: 'home' | 'order-edit' (default: 'home')
 * 
 * CALLBACKS:
 * - onSlotClick: (slotId) => void (opzionale, se non c'è usa href)
 */

import { labels, a11y, thresholds } from '../../config/ui.config.js';
import { listen } from '../../utils/dom.js';

export function renderTimeSlotCard(slot, variant = 'home', onSlotClick = null) {
    const { id, timeLabel, slotsLeft, href, isDisabled } = slot;

    const isFullyBooked = slotsLeft === 0;
    const isLowSlots = slotsLeft > 0 && slotsLeft <= thresholds.lowSlotsThreshold;

    let ariaLabel;
    if (isFullyBooked) {
        ariaLabel = a11y.slots.fullyBooked(timeLabel);
    } else {
        ariaLabel = a11y.slots.available(timeLabel, slotsLeft);
    }

    // Colori in base a disponibilità
    let slotsBadgeColor = 'text-emerald-500';
    let cardOpacity = '';
    let ctaClasses = 'w-full py-2 bg-primary text-white text-xs flex items-center justify-center font-bold rounded-lg active:scale-95 transition-transform shadow-lg shadow-primary/20';
    
    if (isFullyBooked) {
        slotsBadgeColor = 'text-rose-500';
        cardOpacity = 'opacity-60';
        ctaClasses = 'w-full py-2 bg-slate-800 text-slate-500 text-xs font-bold rounded-lg cursor-not-allowed';
    } else if (isLowSlots) {
        slotsBadgeColor = 'text-amber-500';
    }

    // Card container: layout verticale, min-w per scroll orizzontale
    // Decide whether to render a <button> (used when a callback handles clicks)
    // or an <a> link (default navigation). Preserve disabled appearance and a11y.
    const hrefTarget = href || '/orders/create';

    let actionHTML;
    const labelText = isFullyBooked ? labels.slots.waitlist : labels.slots.book_cta;

    if (onSlotClick) {
        // Keep button that will be handled by delegated click listener
        actionHTML = `
            <button
                type="button"
                class="${ctaClasses}"
                ${isFullyBooked || isDisabled ? 'disabled' : ''}
                data-action="book-slot"
                data-slot-id="${id}"
                data-slot-href="${hrefTarget}"
            >
                ${labelText}
            </button>
        `;
    } else {
        // Render an anchor so clicking navigates to the create order page (or slot.href)
        // For disabled/fully-booked, disable pointer events and add aria-disabled
        const anchorDisabledAttrs = (isFullyBooked || isDisabled)
            ? 'aria-disabled="true" tabindex="-1"' : '';
        const anchorClasses = (isFullyBooked || isDisabled)
            ? `${ctaClasses} pointer-events-none` : ctaClasses;

        actionHTML = `
            <a
                href="${hrefTarget}"
                class="${anchorClasses}"
                ${anchorDisabledAttrs}
                data-action="book-slot"
                data-slot-id="${id}"
                data-slot-href="${hrefTarget}"
            >
                ${labelText}
            </a>
        `;
    }

    const html = `
        <div class="min-w-40 p-4 rounded-2xl border border-border-dark bg-surface-dark flex flex-col gap-4 shadow-lg ${cardOpacity}" aria-label="${ariaLabel}">
            <div>
                <p class="text-white text-base font-bold">${timeLabel}</p>
                <p class="${slotsBadgeColor} text-[10px] font-bold uppercase tracking-wider mt-1">
                    ${isFullyBooked ? labels.slots.fully_booked : labels.slots.slots_left(slotsLeft)}
                </p>
            </div>
            ${actionHTML}
        </div>
    `;

    return html;
}

export function renderTimeSlotsList(container, props, callbacks) {
    if (!container) {
        console.warn('[TimeSlotsList] Container is null');
        return;
    }

    console.debug('[TimeSlotsList] Rendering with props:', {
        slotsCount: props.slots?.length || 0,
        dateLabel: props.dateLabel,
        locationLabel: props.locationLabel,
    });

    const { slots } = props;
    const { onSlotClick } = callbacks || {};

    // Slots
    if (!slots || slots.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center w-full py-8">
                <p class="text-slate-500 text-sm">${labels.booking.no_slots}</p>
            </div>
        `;
        console.log('[TimeSlotsList] Rendered (no slots)');
        return;
    }

    const slotsHTML = slots
        .map(slot => renderTimeSlotCard(slot, 'home', onSlotClick))
        .join('');

    // Container scroll orizzontale (no scrollbar visibile)
    container.innerHTML = `<div class="flex overflow-x-auto no-scrollbar gap-4">${slotsHTML}</div>`;

    // Event delegation se onSlotClick passato
    if (onSlotClick) {
        listen(container, 'click', (e) => {
            const button = e.target.closest('[data-slot-id]');
            if (button) {
                const slotId = button.dataset.slotId;
                onSlotClick(slotId);
            }
        });
    }

    console.log(`[TimeSlotsList] Rendered (${slots.length} slots)`);
}

export default { renderTimeSlotCard, renderTimeSlotsList };
