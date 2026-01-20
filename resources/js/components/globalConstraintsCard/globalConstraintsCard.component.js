/**
 * GLOBAL CONSTRAINTS CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Visualizza vincoli globali settimanali
 * - Max orders per slot (stepper)
 * - Max pending time (stepper)
 * - Location (text input)
 * 
 * COMPORTAMENTO:
 * - In settimane passate: tutti i campi DISABLED
 * - In settimane correnti/future: tutti i campi EDITABILI
 * - Stato disabled comunicato via aria-disabled e testo
 * 
 * PROPS:
 * - maxOrdersPerSlot: number
 * - maxPendingTime: number
 * - location: string
 * - isEditable: boolean
 * - isLoading: boolean
 * - timeSlotDuration: number
 * 
 * CALLBACKS:
 * - onIncrementMaxOrders: () => void
 * - onDecrementMaxOrders: () => void
 * - onIncrementMaxPendingTime: () => void
 * - onDecrementMaxPendingTime: () => void
 * - onLocationChange: (value) => void
 */

/**
 * Render Global Constraints Card component
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} props - Component props
 * @param {Object} callbacks - Event callbacks
 */
export function renderGlobalConstraintsCard(container, props, callbacks) {
    if (!container) return;

    const { 
        maxOrdersPerSlot, 
        maxPendingTime, 
        location, 
        isEditable = true, 
        isLoading = false,
        timeSlotDuration = 15 
    } = props;

    // Loading state - mostra skeleton
    if (isLoading) {
        container.innerHTML = `
            <section class="bg-card-dark border border-border-dark rounded-2xl overflow-hidden shadow-xl animate-pulse">
                <div class="px-4 py-3 border-b border-border-dark bg-white/5">
                    <div class="h-3 w-32 bg-slate-700 rounded"></div>
                </div>
                <div class="p-4 space-y-4">
                    <div class="h-12 bg-slate-800 rounded-lg"></div>
                    <div class="h-px bg-border-dark"></div>
                    <div class="h-12 bg-slate-800 rounded-lg"></div>
                    <div class="h-px bg-border-dark"></div>
                    <div class="h-12 bg-slate-800 rounded-lg"></div>
                </div>
            </section>
        `;
        return;
    }

    // Classi e attributi per stato disabled
    const disabledClass = !isEditable ? 'opacity-50' : '';
    const disabledCursor = !isEditable ? 'cursor-not-allowed' : '';
    const buttonDisabledAttr = !isEditable ? 'disabled aria-disabled="true"' : '';
    const inputDisabledAttr = !isEditable ? 'disabled aria-disabled="true"' : '';
    
    // Testo informativo per accessibilità quando disabled
    const disabledNotice = !isEditable ? `
        <div class="mt-2 flex items-center gap-1 text-amber-500 text-[10px]">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">info</span>
            <span>Settimana passata - Non modificabile</span>
        </div>
    ` : '';

    container.innerHTML = `
        <section class="bg-card-dark border border-border-dark rounded-2xl overflow-hidden shadow-xl ${disabledClass}">
            <div class="px-4 py-3 border-b border-border-dark bg-white/5">
                <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Constraints</h2>
                ${disabledNotice}
            </div>
            <div class="p-4 space-y-4">
                <!-- Max Orders Per Slot -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-white">Sandwiches per Slot</p>
                        <p class="text-[11px] text-slate-400 italic">Capacity per ${timeSlotDuration}min window</p>
                    </div>
                    <div class="flex items-center bg-background-dark border border-border-dark rounded-lg p-1 ${disabledCursor}">
                        <button 
                            type="button"
                            data-action="decrement-max-orders"
                            class="w-8 h-8 flex items-center justify-center text-primary transition-colors hover:bg-white/10 rounded
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            ${buttonDisabledAttr}
                            aria-label="Decrease sandwiches per slot"
                        >
                            <span class="material-symbols-outlined text-lg text-white" aria-hidden="true">remove</span>
                        </button>
                        <input 
                            type="number" 
                            value="${maxOrdersPerSlot}" 
                            readonly 
                            class="w-10 bg-transparent border-none text-center text-sm font-bold focus:ring-0 p-0 text-white"
                            aria-label="Sandwiches per slot: ${maxOrdersPerSlot}"
                            tabindex="-1"
                        >
                        <button 
                            type="button"
                            data-action="increment-max-orders"
                            class="w-8 h-8 flex items-center justify-center text-primary transition-colors hover:bg-white/10 rounded
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            ${buttonDisabledAttr}
                            aria-label="Increase sandwiches per slot"
                        >
                            <span class="material-symbols-outlined text-lg text-white" aria-hidden="true">add</span>
                        </button>
                    </div>
                </div>

                <div class="h-px bg-border-dark"></div>

                <!-- Max Pending Time -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-white">Order Deadline</p>
                        <p class="text-[11px] text-slate-400 italic">Mins before slot start</p>
                    </div>
                    <div class="flex items-center bg-background-dark border border-border-dark rounded-lg p-1 ${disabledCursor}">
                        <button 
                            type="button"
                            data-action="decrement-max-pending-time"
                            class="w-8 h-8 flex items-center justify-center text-primary transition-colors hover:bg-white/10 rounded
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            ${buttonDisabledAttr}
                            aria-label="Decrease order deadline"
                        >
                            <span class="material-symbols-outlined text-lg text-white" aria-hidden="true">remove</span>
                        </button>
                        <input 
                            type="number" 
                            value="${maxPendingTime}" 
                            readonly 
                            class="w-10 bg-transparent border-none text-center text-sm font-bold focus:ring-0 p-0 text-white"
                            aria-label="Order deadline in minutes: ${maxPendingTime}"
                            tabindex="-1"
                        >
                        <button 
                            type="button"
                            data-action="increment-max-pending-time"
                            class="w-8 h-8 flex items-center justify-center text-primary transition-colors hover:bg-white/10 rounded
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            ${buttonDisabledAttr}
                            aria-label="Increase order deadline"
                        >
                            <span class="material-symbols-outlined text-lg text-white" aria-hidden="true">add</span>
                        </button>
                    </div>
                </div>

                <div class="h-px bg-border-dark"></div>

                <!-- Location -->
                <div class="space-y-2">
                    <div>
                        <p class="text-sm font-medium text-white">Service Location</p>
                        <p class="text-[11px] text-slate-400 italic">Where the truck operates</p>
                    </div>
                    <input 
                        type="text"
                        data-location-input
                        value="${escapeHtml(location)}"
                        ${inputDisabledAttr}
                        class="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm text-white
                               focus:ring-1 focus:ring-primary focus:border-primary
                               disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter service location"
                        aria-label="Service location"
                    >
                </div>
            </div>
        </section>
    `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export default { renderGlobalConstraintsCard };
