/**
 * DAY CONFIG CARD COMPONENT
 * 
 * RESPONSABILITÀ:
 * - Visualizza configurazione di un singolo giorno
 * - Toggle attivo/inattivo
 * - Selettori orario start/end con dropdown custom
 * 
 * COMPORTAMENTO:
 * - Giorni passati (isEditable=false): completamente DISABLED
 *   - Switch non cliccabile
 *   - Dropdown orari NON si aprono
 *   - Messaggio informativo visibile
 * - Giorni futuri (isEditable=true): completamente EDITABILI
 * 
 * GUARD PATTERN:
 * - Ogni interazione verifica isEditable PRIMA di procedere
 * - Click su elementi disabled: event.preventDefault()
 * 
 * PROPS:
 * - date: string (YYYY-MM-DD)
 * - dayOfWeek: number (0=Mon, 6=Sun)
 * - dayName: string (Monday, Tuesday, ...)
 * - dayNameShort: string (Mon, Tue, ...)
 * - dayNumber: number (1-31)
 * - isActive: boolean
 * - startTime: string (HH:MM)
 * - endTime: string (HH:MM)
 * - isEditable: boolean
 * - hasOrders: boolean
 * - ordersCount: number
 * - timeSlotDuration: number
 * 
 * CALLBACKS:
 * - onToggle: () => void
 * - onStartTimeChange: (time) => void
 * - onEndTimeChange: (time) => void
 */

/**
 * Render Day Config Card component
 * 
 * @param {HTMLElement} container - Container element
 * @param {Object} props - Component props
 * @param {Object} callbacks - Event callbacks
 */
export function renderDayConfigCard(container, props, callbacks) {
    if (!container) return;

    const { 
        date,
        dayOfWeek,
        dayName,
        dayNameShort,
        dayNumber,
        isActive,
        startTime,
        endTime,
        isEditable,
        hasOrders,
        ordersCount,
        timeSlotDuration = 15
    } = props;

    // Generate time options
    const timeOptions = generateTimeOptions(timeSlotDuration);

    // Status indicator
    const statusColor = isActive ? 'emerald' : 'slate';
    const statusLabel = isActive ? 'Active' : 'Inactive';

    // Card styling based on state
    const cardOpacity = isEditable ? '' : 'opacity-60';
    const badgeColor = isActive ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-700/50 border-slate-600 text-slate-400';

    // Not editable message - giorno passato
    const notEditableHtml = !isEditable ? `
        <div class="mt-3 text-[10px] text-amber-500 flex items-center gap-1">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">info</span>
            <span>Giorno passato - Non modificabile</span>
        </div>
    ` : '';

    // Orders warning - solo per giorni editabili con ordini
    const ordersWarningHtml = hasOrders && isEditable ? `
        <div class="mt-3 text-[10px] text-amber-500 flex items-center gap-1">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">warning</span>
            <span>${ordersCount} order${ordersCount > 1 ? 's' : ''} will be affected</span>
        </div>
    ` : '';

    // Attributi per elementi disabled
    const toggleDisabledAttr = !isEditable ? 'disabled aria-disabled="true"' : '';
    const dropdownDisabledClass = !isEditable ? 'pointer-events-none opacity-50 cursor-not-allowed' : '';

    container.innerHTML = `
        <style>
            .dropdown-options {
                max-height: 200px;
                overflow-y: auto;
                padding: 0.5rem;
                scrollbar-width: thin;
            }
            .dropdown-options::-webkit-scrollbar {
                width: 6px;
            }
            .dropdown-options::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
            }
            .dropdown-options::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
            }
        </style>
        <div class="bg-card-dark border border-border-dark rounded-2xl p-4 transition-all ${cardOpacity}" data-day-card="${date}">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl ${badgeColor} border flex flex-col items-center justify-center">
                        <span class="text-[9px] font-bold uppercase text-white">${dayNameShort}</span>
                        <span class="text-sm font-bold text-white">${dayNumber}</span>
                    </div>
                    <div>
                        <span class="text-sm font-bold text-white">${dayName}</span>
                        <div class="flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-${statusColor}-500"></span>
                            <span class="text-[10px] text-${statusColor}-500 font-bold uppercase">${statusLabel}</span>
                        </div>
                    </div>
                </div>
                <label class="relative inline-flex items-center ${isEditable ? 'cursor-pointer' : 'cursor-not-allowed'}">
                    <input 
                        type="checkbox" 
                        data-day-toggle="${date}"
                        ${isActive ? 'checked' : ''}
                        ${toggleDisabledAttr}
                        class="sr-only peer"
                        aria-label="Toggle ${dayName} active status"
                    >
                    <div class="toggle-bg w-11 h-6 bg-slate-700 peer-checked:bg-primary rounded-full transition-colors relative peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                        <div class="toggle-dot absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm"></div>
                    </div>
                </label>
            </div>
            
            ${isActive ? `
                <div class="grid grid-cols-2 gap-3">
                    <!-- Start Time Dropdown -->
                    <div class="space-y-1">
                        <label class="text-[10px] text-slate-500 font-bold uppercase ml-1">Start Time</label>
                        <div class="relative ${dropdownDisabledClass}">
                            <button 
                                type="button" 
                                class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-background-dark border border-border-dark text-sm font-medium text-white hover:bg-background-dark/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background-dark" 
                                data-start-time-dropdown="${date}" 
                                aria-haspopup="listbox" 
                                aria-expanded="false"
                                ${!isEditable ? 'disabled aria-disabled="true"' : ''}
                            >
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-base text-slate-400" aria-hidden="true">schedule</span>
                                    <span>${startTime}</span>
                                </span>
                                <span class="material-symbols-outlined text-sm text-slate-400" aria-hidden="true">expand_more</span>
                            </button>
                            <div 
                                class="absolute top-full left-0 right-0 mt-1 bg-background-dark border border-border-dark rounded-xl shadow-lg z-10 hidden dropdown-options" 
                                data-start-time-options="${date}" 
                                role="listbox"
                                aria-label="Select start time"
                            >
                                ${timeOptions.map(time => `
                                    <button 
                                        type="button" 
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left ${time === startTime ? 'bg-white/5' : ''}" 
                                        data-action="select-start-time" 
                                        data-time="${time}" 
                                        data-date="${date}" 
                                        role="option" 
                                        aria-selected="${time === startTime}"
                                    >
                                        <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style="background-color: rgba(59, 130, 246, 0.19);">
                                            <span class="material-symbols-outlined text-sm" style="color: rgb(59, 130, 246);" aria-hidden="true">schedule</span>
                                        </div>
                                        <span class="text-white text-sm font-medium whitespace-nowrap">${time}</span>
                                        ${time === startTime ? '<span class="material-symbols-outlined text-xs ml-auto text-slate-400" aria-hidden="true">check</span>' : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <!-- End Time Dropdown -->
                    <div class="space-y-1">
                        <label class="text-[10px] text-slate-500 font-bold uppercase ml-1">End Time</label>
                        <div class="relative ${dropdownDisabledClass}">
                            <button 
                                type="button" 
                                class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-background-dark border border-border-dark text-sm font-medium text-white hover:bg-background-dark/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background-dark" 
                                data-end-time-dropdown="${date}" 
                                aria-haspopup="listbox" 
                                aria-expanded="false"
                                ${!isEditable ? 'disabled aria-disabled="true"' : ''}
                            >
                                <span class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-base text-slate-400" aria-hidden="true">schedule</span>
                                    <span>${endTime}</span>
                                </span>
                                <span class="material-symbols-outlined text-sm text-slate-400" aria-hidden="true">expand_more</span>
                            </button>
                            <div 
                                class="absolute top-full left-0 right-0 mt-1 bg-background-dark border border-border-dark rounded-xl shadow-lg z-10 hidden dropdown-options" 
                                data-end-time-options="${date}" 
                                role="listbox"
                                aria-label="Select end time"
                            >
                                ${timeOptions.map(time => `
                                    <button 
                                        type="button" 
                                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left ${time === endTime ? 'bg-white/5' : ''}" 
                                        data-action="select-end-time" 
                                        data-time="${time}" 
                                        data-date="${date}" 
                                        role="option" 
                                        aria-selected="${time === endTime}"
                                    >
                                        <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style="background-color: rgba(59, 130, 246, 0.19);">
                                            <span class="material-symbols-outlined text-sm" style="color: rgb(59, 130, 246);" aria-hidden="true">schedule</span>
                                        </div>
                                        <span class="text-white text-sm font-medium whitespace-nowrap">${time}</span>
                                        ${time === endTime ? '<span class="material-symbols-outlined text-xs ml-auto text-slate-400" aria-hidden="true">check</span>' : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            ${notEditableHtml}
            ${ordersWarningHtml}
        </div>
    `;

    // Fix the toggle dot animation with CSS
    const toggleInput = container.querySelector('[data-day-toggle]');
    const toggleDot = container.querySelector('.toggle-dot');
    if (toggleInput && toggleDot) {
        if (toggleInput.checked) {
            toggleDot.style.transform = 'translateX(20px)';
        } else {
            toggleDot.style.transform = 'translateX(0)';
        }
    }

    // GUARD: Non aggiungere event listeners se il giorno non è editabile
    if (!isEditable) {
        console.log(`[DayConfigCard] Giorno ${date} non editabile, no event listeners`);
        return;
    }

    // Dropdown functionality - SOLO per giorni editabili
    const startTimeDropdown = container.querySelector(`[data-start-time-dropdown="${date}"]`);
    const startTimeOptions = container.querySelector(`[data-start-time-options="${date}"]`);
    const endTimeDropdown = container.querySelector(`[data-end-time-dropdown="${date}"]`);
    const endTimeOptions = container.querySelector(`[data-end-time-options="${date}"]`);

    // Toggle dropdown visibility
    function toggleDropdown(dropdown, options, event) {
        // GUARD: verifica che il pulsante non sia disabled
        if (dropdown.disabled || dropdown.getAttribute('aria-disabled') === 'true') {
            console.log('[DayConfigCard] Dropdown disabled, ignoro click');
            event?.preventDefault();
            event?.stopPropagation();
            return;
        }
        
        const isExpanded = dropdown.getAttribute('aria-expanded') === 'true';
        
        // Chiudi tutti gli altri dropdown prima
        document.querySelectorAll('.dropdown-options').forEach(opt => {
            if (opt !== options) {
                opt.classList.add('hidden');
            }
        });
        document.querySelectorAll('[data-start-time-dropdown], [data-end-time-dropdown]').forEach(btn => {
            if (btn !== dropdown) {
                btn.setAttribute('aria-expanded', 'false');
            }
        });
        
        dropdown.setAttribute('aria-expanded', !isExpanded);
        options.classList.toggle('hidden');
    }

    // Close dropdown
    function closeDropdown(dropdown, options) {
        dropdown.setAttribute('aria-expanded', 'false');
        options.classList.add('hidden');
    }

    // Event listeners for dropdown toggles
    if (startTimeDropdown && startTimeOptions) {
        startTimeDropdown.addEventListener('click', (e) => toggleDropdown(startTimeDropdown, startTimeOptions, e));
    }
    if (endTimeDropdown && endTimeOptions) {
        endTimeDropdown.addEventListener('click', (e) => toggleDropdown(endTimeDropdown, endTimeOptions, e));
    }

    // Handle option selection
    container.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const time = button.getAttribute('data-time');
        const dateAttr = button.getAttribute('data-date');

        // GUARD: ignora se la data non corrisponde
        if (dateAttr !== date) return;

        if (action === 'select-start-time') {
            // Update start time display
            if (startTimeDropdown) {
                const displaySpan = startTimeDropdown.querySelector('span > span:last-child');
                if (displaySpan) displaySpan.textContent = time;
            }

            // Update selected state
            if (startTimeOptions) {
                startTimeOptions.querySelectorAll('[data-action="select-start-time"]').forEach(btn => {
                    btn.classList.remove('bg-white/5');
                    btn.querySelector('.ml-auto')?.remove();
                    btn.setAttribute('aria-selected', 'false');
                });
            }
            button.classList.add('bg-white/5');
            button.setAttribute('aria-selected', 'true');
            if (!button.querySelector('.ml-auto')) {
                button.insertAdjacentHTML('beforeend', '<span class="material-symbols-outlined text-xs ml-auto text-slate-400" aria-hidden="true">check</span>');
            }

            // Close dropdown
            if (startTimeDropdown && startTimeOptions) {
                closeDropdown(startTimeDropdown, startTimeOptions);
            }

            // Trigger callback
            if (callbacks.onStartTimeChange) {
                callbacks.onStartTimeChange(time);
            }
            
        } else if (action === 'select-end-time') {
            // Update end time display
            if (endTimeDropdown) {
                const displaySpan = endTimeDropdown.querySelector('span > span:last-child');
                if (displaySpan) displaySpan.textContent = time;
            }

            // Update selected state
            if (endTimeOptions) {
                endTimeOptions.querySelectorAll('[data-action="select-end-time"]').forEach(btn => {
                    btn.classList.remove('bg-white/5');
                    btn.querySelector('.ml-auto')?.remove();
                    btn.setAttribute('aria-selected', 'false');
                });
            }
            button.classList.add('bg-white/5');
            button.setAttribute('aria-selected', 'true');
            if (!button.querySelector('.ml-auto')) {
                button.insertAdjacentHTML('beforeend', '<span class="material-symbols-outlined text-xs ml-auto text-slate-400" aria-hidden="true">check</span>');
            }

            // Close dropdown
            if (endTimeDropdown && endTimeOptions) {
                closeDropdown(endTimeDropdown, endTimeOptions);
            }

            // Trigger callback
            if (callbacks.onEndTimeChange) {
                callbacks.onEndTimeChange(time);
            }
        }
    });

    // Close dropdown when clicking outside
    const closeOnClickOutside = (e) => {
        const isInsideStartDropdown = startTimeDropdown?.contains(e.target) || startTimeOptions?.contains(e.target);
        const isInsideEndDropdown = endTimeDropdown?.contains(e.target) || endTimeOptions?.contains(e.target);
        
        if (!isInsideStartDropdown && startTimeDropdown && startTimeOptions) {
            closeDropdown(startTimeDropdown, startTimeOptions);
        }
        if (!isInsideEndDropdown && endTimeDropdown && endTimeOptions) {
            closeDropdown(endTimeDropdown, endTimeOptions);
        }
    };
    
    // Aggiungi listener globale per chiudere dropdown
    // Rimuovi prima eventuali listener precedenti
    document.removeEventListener('click', container._closeDropdownHandler);
    container._closeDropdownHandler = closeOnClickOutside;
    document.addEventListener('click', closeOnClickOutside);
}

/**
 * Generate time options based on slot duration
 */
function generateTimeOptions(duration) {
    const options = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += duration) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    return options;
}

export default { renderDayConfigCard };
