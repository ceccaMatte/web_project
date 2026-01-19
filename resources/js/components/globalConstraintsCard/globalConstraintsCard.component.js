/**
 * GLOBAL CONSTRAINTS CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Visualizza vincoli globali settimanali
 * - Max orders per slot (stepper)
 * - Max pending time (stepper)
 * - Location (text input)
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

    const disabledClass = !isEditable ? 'opacity-50 cursor-not-allowed' : '';
    const buttonDisabledAttr = !isEditable ? 'disabled' : '';

    container.innerHTML = `
        <section class="bg-card-dark border border-border-dark rounded-2xl overflow-hidden shadow-xl">
            <div class="px-4 py-3 border-b border-border-dark bg-white/5">
                <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Constraints</h2>
            </div>
            <div class="p-4 space-y-4">
                <!-- Max Orders Per Slot -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium">Sandwiches per Slot</p>
                        <p class="text-[11px] text-slate-500 italic">Capacity per ${timeSlotDuration}min window</p>
                    </div>
                    <div class="flex items-center bg-background-dark border border-border-dark rounded-lg p-1 ${disabledClass}">
                        <button 
                            type="button"
                            data-action="decrement-max-orders"
                            class="w-8 h-8 flex items-center justify-center text-primary disabled:text-slate-600"
                            ${buttonDisabledAttr}
                            aria-label="Decrease sandwiches per slot"
                        >
                            <span class="material-symbols-outlined text-lg">remove</span>
                        </button>
                        <input 
                            type="number" 
                            value="${maxOrdersPerSlot}" 
                            readonly 
                            class="w-10 bg-transparent border-none text-center text-sm font-bold focus:ring-0 p-0"
                            aria-label="Sandwiches per slot"
                        >
                        <button 
                            type="button"
                            data-action="increment-max-orders"
                            class="w-8 h-8 flex items-center justify-center text-primary disabled:text-slate-600"
                            ${buttonDisabledAttr}
                            aria-label="Increase sandwiches per slot"
                        >
                            <span class="material-symbols-outlined text-lg">add</span>
                        </button>
                    </div>
                </div>

                <div class="h-px bg-border-dark"></div>

                <!-- Max Pending Time -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium">Order Deadline</p>
                        <p class="text-[11px] text-slate-500 italic">Mins before slot start</p>
                    </div>
                    <div class="flex items-center bg-background-dark border border-border-dark rounded-lg p-1 ${disabledClass}">
                        <button 
                            type="button"
                            data-action="decrement-max-pending-time"
                            class="w-8 h-8 flex items-center justify-center text-primary disabled:text-slate-600"
                            ${buttonDisabledAttr}
                            aria-label="Decrease order deadline"
                        >
                            <span class="material-symbols-outlined text-lg">remove</span>
                        </button>
                        <input 
                            type="number" 
                            value="${maxPendingTime}" 
                            readonly 
                            class="w-10 bg-transparent border-none text-center text-sm font-bold focus:ring-0 p-0"
                            aria-label="Order deadline in minutes"
                        >
                        <button 
                            type="button"
                            data-action="increment-max-pending-time"
                            class="w-8 h-8 flex items-center justify-center text-primary disabled:text-slate-600"
                            ${buttonDisabledAttr}
                            aria-label="Increase order deadline"
                        >
                            <span class="material-symbols-outlined text-lg">add</span>
                        </button>
                    </div>
                </div>

                <div class="h-px bg-border-dark"></div>

                <!-- Location -->
                <div class="space-y-2">
                    <div>
                        <p class="text-sm font-medium">Service Location</p>
                        <p class="text-[11px] text-slate-500 italic">Where the truck operates</p>
                    </div>
                    <input 
                        type="text"
                        data-location-input
                        value="${escapeHtml(location)}"
                        ${!isEditable ? 'disabled' : ''}
                        class="w-full bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-sm 
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
