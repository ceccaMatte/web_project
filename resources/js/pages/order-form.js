/**
 * ORDER FORM PAGE - State Management & UI Logic
 * 
 * PATTERN ARCHITETTURALE:
 * - orderFormState: SSOT (Single Source of Truth) - contiene SOLO dati
 * - orderFormView: riferimenti DOM + funzioni render
 * - Unidirectional data flow: evento → modifica state → render
 * 
 * RESPONSABILITÀ:
 * - Gestione selezione time slot (Pickup Time)
 * - Event delegation per click su slot
 * - Render deterministico basato su stato
 * 
 * COSA NON FA:
 * - Nessun fetch (i dati arrivano dal backend)
 * - Nessun DOM reference in orderFormState
 * - Nessuna logica inline
 */

// =============================================================================
// STATE (SSOT)
// =============================================================================

/**
 * STATO GLOBALE PAGINA ORDER FORM (SSOT)
 * 
 * Contiene SOLO dati, mai riferimenti DOM.
 */
const orderFormState = {
    /**
     * ID dello slot attualmente selezionato
     * null se nessuno selezionato
     */
    selectedSlotId: null,

    /**
     * Array di time slots disponibili
     * Struttura di ogni slot:
     * {
     *   id: string|number,
     *   timeLabel: string (es. "11:00 AM"),
     *   isAvailable: boolean
     * }
     */
    slots: [],

    /**
     * Modalità form: 'create' | 'update'
     * Usato per determinare comportamenti specifici
     */
    mode: 'create',

    /**
     * ID dell'ordine in modifica (solo per mode='update')
     */
    orderId: null,
};

// =============================================================================
// VIEW LAYER
// =============================================================================

/**
 * VIEW LAYER
 * 
 * Contiene:
 * - Riferimenti DOM (cached)
 * - Funzioni di render
 * 
 * NON contiene dati applicativi.
 */
const orderFormView = {
    /**
     * Riferimenti DOM (cached una sola volta)
     */
    refs: {
        pickupTimeSection: null,
        slotsContainer: null,
        selectedSlotInput: null, // hidden input per form submission
    },

    /**
     * Inizializza riferimenti DOM.
     * Chiamato una sola volta all'avvio.
     */
    init() {
        this.refs.pickupTimeSection = document.querySelector('[data-pickup-time-section]');
        this.refs.slotsContainer = document.querySelector('[data-pickup-slots-container]');
        this.refs.selectedSlotInput = document.querySelector('[data-selected-slot-input]');

        if (!this.refs.slotsContainer) {
            // Non è un errore bloccante: la UI può funzionare anche senza la sezione pickup
            // Mostriamo un warning invece di un errore per evitare falsi positivi nei log.
            console.warn('[OrderForm] Pickup slots container not found (pickup time section will be skipped)');
        }
    },

    /**
     * Renderizza gli slot di pickup time.
     * 
     * RESPONSABILITÀ:
     * - Legge SOLO da orderFormState
     * - Genera HTML per ogni slot usando TimeSlotCard variant="order"
     * - Calcola status in base a isAvailable e selectedSlotId
     * 
     * COSA NON FA:
     * - NON fa fetch
     * - NON modifica orderFormState
     */
    renderPickupSlots() {
        if (!this.refs.slotsContainer) {
            console.warn('[OrderForm] Cannot render pickup slots: container not found');
            return;
        }

        const { slots, selectedSlotId } = orderFormState;

        // Se non ci sono slot, mostra messaggio
        if (!slots || slots.length === 0) {
            this.refs.slotsContainer.innerHTML = `
                <div class="flex items-center justify-center w-full py-8">
                    <p class="text-slate-500 text-sm">No time slots available</p>
                </div>
            `;
            console.log('[OrderForm] Pickup slots rendered: no slots available');
            return;
        }

        // Configurazione labels (stesse di config/ui.php)
        const labels = {
            selected: 'Selected',
            full: 'Full',
            available: 'Available',
        };

        // Genera HTML per ogni slot
        let slotsHTML = '';

        slots.forEach(slot => {
            const { id, timeLabel, isAvailable } = slot;

            // Calcola status
            let status;
            let isSelected = false;
            if (!isAvailable) {
                status = 'full';
            } else if (String(id) === String(selectedSlotId)) {
                status = 'selected';
                isSelected = true;
            } else {
                status = 'available';
            }

            // Classi base comuni
            const baseClasses = 'flex flex-col items-center justify-center min-w-[100px] h-24 rounded-xl transition-all';
            
            // Classi specifiche per stato
            let stateClasses;
            let timeColor;
            let labelColor;

            switch (status) {
                case 'selected':
                    stateClasses = 'bg-primary/10 border-2 border-primary';
                    timeColor = 'text-white';
                    labelColor = 'text-primary';
                    break;
                case 'full':
                    stateClasses = 'bg-surface-dark/50 border border-border-dark opacity-50';
                    timeColor = 'text-slate-500';
                    labelColor = 'text-rose-500';
                    break;
                case 'available':
                default:
                    stateClasses = 'bg-surface-dark border border-border-dark hover:border-primary/50 cursor-pointer';
                    timeColor = 'text-slate-300';
                    labelColor = 'text-slate-500';
                    break;
            }

            // Focus ring classes
            const focusClasses = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark';

            // Aria label
            const ariaLabel = `Pickup time ${timeLabel}, ${status}`;

            // Status label text
            const statusLabel = labels[status] || labels.available;

            // Genera HTML in base allo stato
            if (status === 'full') {
                // Stato FULL: div non cliccabile
                slotsHTML += `
                    <div 
                        class="${baseClasses} ${stateClasses}"
                        data-slot-id="${id}"
                        aria-disabled="true"
                        aria-label="${ariaLabel}"
                        role="button"
                    >
                        <p class="text-[16px] font-bold ${timeColor}">${timeLabel}</p>
                        <p class="${labelColor} text-[10px] font-bold uppercase mt-1">${statusLabel}</p>
                    </div>
                `;
            } else {
                // Stati SELECTED e AVAILABLE: button cliccabile
                slotsHTML += `
                    <button 
                        type="button"
                        class="${baseClasses} ${stateClasses} ${focusClasses}"
                        data-slot-id="${id}"
                        aria-pressed="${isSelected ? 'true' : 'false'}"
                        aria-label="${ariaLabel}"
                    >
                        <p class="text-[16px] font-bold ${timeColor}">${timeLabel}</p>
                        <p class="${labelColor} text-[10px] font-bold uppercase mt-1">${statusLabel}</p>
                    </button>
                `;
            }
        });

        // Monta gli slot nel container
        this.refs.slotsContainer.innerHTML = slotsHTML;

        // Aggiorna hidden input per form submission
        if (this.refs.selectedSlotInput) {
            this.refs.selectedSlotInput.value = selectedSlotId || '';
        }

        console.log('[OrderForm] Pickup slots rendered:', slots.length, 'slots, selected:', selectedSlotId);
    },
};

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * EVENT HANDLERS
 * 
 * Gestisce eventi UI tramite event delegation.
 */
const orderFormHandlers = {
    /**
     * Gestisce il click su uno slot.
     * 
     * LOGICA:
     * - Se slot è "full" → ignora (non cliccabile)
     * - Se slot è già "selected" → ignora (idempotenza)
     * - Se slot è "available" → seleziona e re-render
     * 
     * @param {string|number} slotId - ID dello slot cliccato
     */
    handleSlotClick(slotId) {
        const slot = orderFormState.slots.find(s => String(s.id) === String(slotId));
        
        if (!slot) {
            console.warn('[OrderForm] Slot not found:', slotId);
            return;
        }

        // Se slot non è disponibile → ignora
        if (!slot.isAvailable) {
            console.log('[OrderForm] Slot is full, ignoring click:', slotId);
            return;
        }

        // Se già selezionato → ignora (idempotenza)
        if (String(orderFormState.selectedSlotId) === String(slotId)) {
            console.log('[OrderForm] Slot already selected, no action:', slotId);
            return;
        }

        console.log('[OrderForm] Slot selection changed:', orderFormState.selectedSlotId, '->', slotId);

        // Aggiorna stato
        orderFormState.selectedSlotId = slotId;

        // Re-render
        orderFormView.renderPickupSlots();
    },

    /**
     * Event delegation handler.
     * Intercetta click su elementi con data-slot-id.
     * 
     * @param {Event} event - Click event
     */
    handleAction(event) {
        // Check per data-slot-id
        const slotElement = event.target.closest('[data-slot-id]');
        if (slotElement) {
            const slotId = slotElement.dataset.slotId;
            this.handleSlotClick(slotId);
            return;
        }
    },
};

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Inizializza la sezione Pickup Time.
 * 
 * WORKFLOW:
 * 1. Legge dati slot iniettati dal backend (JSON inline)
 * 2. Aggiorna orderFormState.slots
 * 3. Chiama renderPickupSlots
 * 
 * @param {Object} slotsData - Dati dal backend { slots: [...], selectedSlotId: ... }
 */
function initPickupTimeSection(slotsData) {
    orderFormState.slots = slotsData?.slots || [];
    orderFormState.selectedSlotId = slotsData?.selectedSlotId || null;

        // Render only if container present
        if (orderFormView.refs.slotsContainer) {
            orderFormView.renderPickupSlots();
        } else {
            console.warn('[OrderForm] Skipping renderPickupSlots: container not found');
        }

        console.log('[OrderForm] Pickup time section initialized:', orderFormState.slots.length, 'slots');
}

/**
 * INIZIALIZZAZIONE PAGINA ORDER FORM
 * 
 * Entry point chiamato da app.js quando data-page="order-form".
 */
export function initOrderFormPage() {
    console.log('[OrderForm] Initializing...');

    // 1. Inizializza riferimenti DOM
    orderFormView.init();

    // 2. Leggi modalità form dal DOM
    const formElement = document.querySelector('[data-order-form]');
    if (formElement) {
        orderFormState.mode = formElement.dataset.mode || 'create';
        orderFormState.orderId = formElement.dataset.orderId || null;
        console.log('[OrderForm] Mode:', orderFormState.mode, 'OrderId:', orderFormState.orderId);
    }

    // 3. Leggi dati pickup slots dal backend (passato via Blade)
    const pickupSlotsElement = document.querySelector('[data-pickup-slots]');
    if (pickupSlotsElement) {
        try {
            const slotsData = JSON.parse(pickupSlotsElement.textContent);
            initPickupTimeSection(slotsData);
        } catch (error) {
            console.error('[OrderForm] Failed to parse pickup slots:', error);
            // Fallback: inizializza con array vuoto
            initPickupTimeSection({ slots: [], selectedSlotId: null });
        }
    } else {
        // Nessun dato: render comunque (mostrerà "no slots")
        initPickupTimeSection({ slots: [], selectedSlotId: null });
    }

    // 4. Event delegation su document
    document.addEventListener('click', (event) => {
        orderFormHandlers.handleAction(event);
    });

    console.log('[OrderForm] Initialized successfully');
}

// Export per uso esterno se necessario
export { orderFormState, orderFormView, orderFormHandlers };
