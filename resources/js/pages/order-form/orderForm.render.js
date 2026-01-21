/**
 * ORDER FORM RENDER ORCHESTRATOR
 * 
 * RESPONSABILITÀ:
 * - Orchestra render di tutti i componenti Order Form
 * - Passa container, props e callbacks ai componenti
 * - Legge da orderFormState, NON lo modifica
 * - Gestisce show/hide loader e content
 * 
 * ARCHITETTURA:
 * - Funzione renderOrderFormPage() chiamata dopo hydration o mutation state
 * - Importa tutti i component renderers
 * - Calcola props da state e le passa ai componenti
 * - Passa callbacks da orderForm.actions.js
 */

import { orderFormState, isOrderValid, isIngredientSelected } from './orderForm.state.js';
import { orderFormView } from './orderForm.view.js';

// Actions (per callbacks)
import { 
    openSidebar, 
    closeSidebar, 
    goBack,
    selectDay,
    selectTimeSlot,
    toggleSection,
    selectIngredient,
    deselectIngredient,
    submitOrder,
    deleteCurrentOrder,
} from './orderForm.actions.js';

// Componenti riutilizzabili
import { renderTopBar } from '../../components/topbar/topbar.component.js';
import { renderSidebar } from '../../components/sidebar/sidebar.component.js';
import { renderWeekScheduler } from '../../components/weekScheduler/weekScheduler.component.js';

// Componenti nuovi
import { renderOrderFormHeader } from '../../components/orderFormHeader/orderFormHeader.component.js';
import { renderSelectedIngredientsSummary } from '../../components/selectedIngredientsSummary/selectedIngredientsSummary.component.js';
import { renderIngredientSections } from '../../components/ingredientSection/ingredientSection.component.js';
import { renderTimeSlotSelector } from '../../components/timeSlotSelector/timeSlotSelector.component.js';
import { renderActionFooter } from '../../components/actionFooter/actionFooter.component.js';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Mostra loader, nascondi content
 */
function showLoader() {
    if (orderFormView.refs.loader) {
        orderFormView.refs.loader.classList.remove('hidden');
    }
    if (orderFormView.refs.content) {
        orderFormView.refs.content.classList.add('hidden');
    }
}

/**
 * Nascondi loader, mostra content
 */
function hideLoader() {
    if (orderFormView.refs.loader) {
        orderFormView.refs.loader.classList.add('hidden');
    }
    if (orderFormView.refs.content) {
        orderFormView.refs.content.classList.remove('hidden');
    }
}

/**
 * Aggiorna isSelected nei weekDays in base al selectedDayId corrente
 */
function updateSchedulerSelection(weekDays, selectedDayId) {
    if (!selectedDayId || !weekDays || weekDays.length === 0) {
        return weekDays;
    }
    
    return weekDays.map(day => ({
        ...day,
        isSelected: day.id === selectedDayId,
    }));
}

// =============================================================================
// MAIN RENDER FUNCTION
// =============================================================================

/**
 * Render completo pagina Order Form.
 * 
 * WORKFLOW:
 * 1. Se loading → mostra loader e return
 * 2. Nascondi loader, mostra content
 * 3. Render tutti i componenti in ordine
 * 
 * IDEMPOTENTE: Può essere chiamata N volte.
 */
export function renderOrderFormPage() {
    console.log('[RenderOrderForm] Rendering page...');

    // 1. Loading state
    if (orderFormState.ui.isLoading) {
        showLoader();
        // Render comunque header e sidebar
        renderTopBarComponent();
        renderSidebarComponent();
        renderHeaderComponent();
        return;
    }

    // 2. Content ready
    hideLoader();

    // DEBUG: Verifica SSOT prima del render
    const summaryCount = orderFormState.order.selectedIngredients.length;
    const selectedIds = orderFormState.order.selectedIngredients.map(i => i.id);
    console.log('[RenderOrderForm] SSOT check:', {
        mode: orderFormState.mode,
        summaryCount,
        selectedIds,
        uniqueIds: [...new Set(selectedIds)].length,
    });

    // 3. Render componenti
    renderTopBarComponent();
    renderSidebarComponent();
    renderHeaderComponent();

    // Solo in CREATE mode
    if (orderFormState.mode === 'create') {
        renderSchedulerComponent();
        renderTimeSlotsComponent();
    }

    renderSummaryComponent();
    renderIngredientsComponent();
    renderFooterComponent();

    console.log('[RenderOrderForm] Page rendered successfully');
}

// =============================================================================
// COMPONENT RENDERS
// =============================================================================

/**
 * Render TopBar component
 */
function renderTopBarComponent() {
    renderTopBar(
        orderFormView.refs.topBar,
        {
            user: orderFormState.user,
            sidebarOpen: orderFormState.sidebarOpen,
        },
        {
            onToggleSidebar: (isOpen) => isOpen ? openSidebar() : closeSidebar(),
        }
    );
}

/**
 * Render Sidebar component
 */
function renderSidebarComponent() {
    renderSidebar(
        orderFormView.refs.sidebar,
        orderFormView.refs.overlay,
        {
            open: orderFormState.sidebarOpen,
            user: orderFormState.user,
        },
        {
            onClose: closeSidebar,
        }
    );
}

/**
 * Render Header component
 */
function renderHeaderComponent() {
    const title = orderFormState.mode === 'create' ? 'Create Order' : 'Modify Order';
    
    renderOrderFormHeader(
        orderFormView.refs.header,
        { title },
        { onBack: goBack }
    );
}

/**
 * Render Week Scheduler (solo CREATE)
 */
function renderSchedulerComponent() {
    // Usa schedulerContainer se esiste, altrimenti schedulerSection
    const container = orderFormView.refs.schedulerContainer || orderFormView.refs.schedulerSection;
    if (!container) return;
    
    const weekDaysWithSelection = updateSchedulerSelection(
        orderFormState.weekDays,
        orderFormState.selectedDayId
    );
    
    renderWeekScheduler(
        container,
        {
            monthLabel: orderFormState.monthLabel,
            weekDays: weekDaysWithSelection,
            showLabel: false, // Label già nel blade template
        },
        {
            onDaySelected: selectDay,
        }
    );
}

/**
 * Render Time Slots (solo CREATE)
 */
function renderTimeSlotsComponent() {
    if (!orderFormView.refs.timeSlotsContainer) return;
    // Normalize backend timeSlots to the shape expected by TimeSlotSelector:
    // { id, timeLabel, slotsLeft, available }
    const rawSlots = orderFormState.availability.timeSlots || [];
    const normalizedSlots = rawSlots.map(s => ({
        id: s.id,
        // Backend may use `time` or `timeLabel`
        timeLabel: s.timeLabel || s.time || s.label || '',
        // Use numeric `available` as slotsLeft when present, otherwise fallback to slotsLeft
        slotsLeft: typeof s.available === 'number' ? s.available : (s.slotsLeft ?? 0),
        // available boolean: true when slotsLeft > 0
        available: (typeof s.available === 'number' ? s.available : (s.slotsLeft ?? 0)) > 0,
    }));

    renderTimeSlotSelector(
        orderFormView.refs.timeSlotsContainer,
        {
            timeSlots: normalizedSlots,
            selectedTimeSlotId: orderFormState.order.selectedTimeSlotId,
        },
        {
            onSelect: selectTimeSlot,
        }
    );
}

/**
 * Render Selected Ingredients Summary
 * Renders to both mobile and desktop containers
 */
function renderSummaryComponent() {
    // Mobile container
    if (orderFormView.refs.summaryContainer) {
        console.log('[RenderOrderForm] renderSummaryComponent: rendering mobile summary, onRemove:', typeof deselectIngredient);
        renderSelectedIngredientsSummary(
            orderFormView.refs.summaryContainer,
            {
                selectedIngredients: orderFormState.order.selectedIngredients,
            },
            {
                onRemove: deselectIngredient,
            }
        );
    }
    
    // Desktop container
    if (orderFormView.refs.summaryContainerDesktop) {
        console.log('[RenderOrderForm] renderSummaryComponent: rendering desktop summary, onRemove:', typeof deselectIngredient);
        renderSelectedIngredientsSummary(
            orderFormView.refs.summaryContainerDesktop,
            {
                selectedIngredients: orderFormState.order.selectedIngredients,
            },
            {
                onRemove: deselectIngredient,
            }
        );
    }
}

/**
 * Render Ingredients Accordion Sections
 * 
 * SINCRONIZZAZIONE AUTOMATICA:
 * Quando un ingrediente viene rimosso da "Your Selection":
 * 1. Lo stato viene aggiornato (removeIngredient)
 * 2. Questa funzione viene chiamata dal re-render completo
 * 3. Legge selectedIds DALLO STATO (non dalla UI)
 * 4. Passa selectedIds a renderIngredientSections
 * 5. Il componente renderizza checkbox unchecked per ingredienti non in selectedIds
 * 
 * SSOT: La UI non decide, riflette solo lo stato.
 */
function renderIngredientsComponent() {
    if (!orderFormView.refs.ingredientsContainer) return;
    
    // SSOT: Deriva gli IDs selezionati DALLO STATO (unica fonte di verità)
    // Questi IDs determinano quali checkbox saranno checked/unchecked
    const selectedIds = orderFormState.order.selectedIngredients.map(i => i.id);
    
    renderIngredientSections(
        orderFormView.refs.ingredientsContainer,
        {
            sections: orderFormState.availability.ingredients,
            openSectionId: orderFormState.openSectionId,
            selectedIngredientIds: selectedIds, // ← Questo sincronizza i checkbox
        },
        {
            onToggle: toggleSection,
            onIngredientSelect: selectIngredient,
        }
    );
}

/**
 * Render Action Footer
 * Renders to both mobile and desktop containers
 */
function renderFooterComponent() {
    const footerProps = {
        mode: orderFormState.mode,
        disabled: !isOrderValid(),
        loading: orderFormState.ui.isSubmitting,
    };
    const footerCallbacks = {
        onSubmit: submitOrder,
        onDelete: deleteCurrentOrder,
    };
    
    // Mobile footer
    if (orderFormView.refs.footerActions) {
        console.log('[RenderOrderForm] Rendering mobile footer');
        renderActionFooter(
            orderFormView.refs.footerActions,
            footerProps,
            footerCallbacks
        );
    } else {
        console.log('[RenderOrderForm] Mobile footer container not found');
    }
    
    // Desktop footer
    if (orderFormView.refs.footerActionsDesktop) {
        console.log('[RenderOrderForm] Rendering desktop footer');
        renderActionFooter(
            orderFormView.refs.footerActionsDesktop,
            footerProps,
            footerCallbacks
        );
    } else {
        console.log('[RenderOrderForm] Desktop footer container not found');
    }
}

// =============================================================================
// EXPORT
// =============================================================================

export default {
    renderOrderFormPage,
};
