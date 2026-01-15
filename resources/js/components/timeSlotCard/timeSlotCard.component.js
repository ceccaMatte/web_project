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
    let slotsBadgeColor = 'text-emerald-400';
    if (isFullyBooked) {
        slotsBadgeColor = 'text-red-400';
    } else if (isLowSlots) {
        slotsBadgeColor = 'text-amber-400';
    }

    // Stato disabled
    const disabledClasses = isDisabled || isFullyBooked
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:bg-slate-800 active:scale-[0.98] cursor-pointer';

    const tag = onSlotClick && !isDisabled && !isFullyBooked ? 'button' : 'a';
    const hrefAttr = tag === 'a' ? `href="${href}"` : '';
    const dataAttr = tag === 'button' ? `data-slot-id="${id}"` : '';

    const html = `
        <${tag}
            ${hrefAttr}
            ${dataAttr}
            class="flex items-center justify-between p-4 rounded-xl border border-border-dark bg-surface-dark transition-all ${disabledClasses}"
            ${isDisabled || isFullyBooked ? 'disabled' : ''}
            aria-label="${ariaLabel}"
        >
            <div class="flex flex-col">
                <span class="text-white text-sm font-bold">${timeLabel}</span>
                <span class="${slotsBadgeColor} text-xs font-medium mt-0.5">
                    ${isFullyBooked ? labels.slots.fully_booked : labels.slots.slots_left(slotsLeft)}
                </span>
            </div>
            <span class="text-primary text-xs font-bold uppercase">
                ${isFullyBooked ? labels.slots.waitlist : labels.slots.book_cta}
            </span>
        </${tag}>
    `;

    return html;
}

export function renderTimeSlotsList(container, props, callbacks) {
    if (!container) return;

    const { dateLabel, locationLabel, slots } = props;
    const { onSlotClick } = callbacks || {};

    // Subtitle
    const subtitle = container.previousElementSibling;
    if (subtitle && dateLabel && locationLabel) {
        subtitle.textContent = `${dateLabel} • ${locationLabel}`;
    }

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

    container.innerHTML = `<div class="grid gap-3">${slotsHTML}</div>`;

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
