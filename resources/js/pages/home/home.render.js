/**
 * HOME RENDER ORCHESTRATOR
 * 
 * RESPONSABILITÀ:
 * - Orchestra render di tutti i componenti Home
 * - Passa container, props e callbacks ai componenti
 * - Legge da homeState, NON lo modifica
 * 
 * ARCHITETTURA:
 * - Funzione renderHome() chiamata dopo hydration o mutation state
 * - Importa tutti i component renderers
 * - Passa callbacks da home.actions.js
 * 
 * UTILIZZO:
 * import { renderHome } from './home.render.js';
 * 
 * // Dopo hydration o state change:
 * renderHome();
 */

import { homeState } from './home.state.js';
import { homeView } from './home.view.js';
import { openSidebar, closeSidebar, selectDay } from './home.actions.js';

// Components
import { renderTopBar } from '../../components/topbar/topbar.component.js';
import { renderSidebar } from '../../components/sidebar/sidebar.component.js';
import { renderTodayServiceCard } from '../../components/todayServiceCard/todayServiceCard.component.js';
import { renderWeekScheduler } from '../../components/weekScheduler/weekScheduler.component.js';
import { renderOrdersPreviewCard } from '../../components/ordersPreviewCard/ordersPreviewCard.component.js';
import { renderTimeSlotsList } from '../../components/timeSlotCard/timeSlotCard.component.js';

/**
 * Render completo pagina Home
 * 
 * WORKFLOW:
 * 1. Legge homeState
 * 2. Chiama component renderers con container + props + callbacks
 * 3. Ogni componente gestisce il proprio DOM
 * 
 * IDEMPOTENTE: Può essere chiamata N volte.
 * Ogni render rimpiazza il contenuto precedente.
 */
export function renderHome() {
    console.log('[RenderHome] Rendering complete home UI...');

    // 1. TopBar
    renderTopBar(
        homeView.refs.topBar,
        {
            user: homeState.user,
            sidebarOpen: homeState.sidebarOpen,
        },
        {
            onToggleSidebar: (isOpen) => isOpen ? openSidebar() : closeSidebar(),
        }
    );

    // 2. Sidebar
    renderSidebar(
        homeView.refs.sidebar,
        homeView.refs.overlay,
        {
            open: homeState.sidebarOpen,
            user: homeState.user,
        },
        {
            onClose: closeSidebar,
        }
    );

    // 3. Today Service Card
    renderTodayServiceCard(
        homeView.refs.todayServiceSection,
        homeState.todayService
    );

    // 4. Week Scheduler
    renderWeekScheduler(
        homeView.refs.schedulerSection,
        {
            monthLabel: homeState.monthLabel,
            weekDays: homeState.weekDays,
        },
        {
            onDaySelected: selectDay,
        }
    );

    // 5. Orders Preview Card
    renderOrdersPreviewCard(
        homeView.refs.orderPreviewContainer,
        homeState.ordersPreview
    );

    // 6. Booking Slots (Time Slot Cards)
    renderTimeSlotsList(
        homeView.refs.bookingSlotsContainer,
        homeState.booking,
        {} // No callbacks per ora (usano href)
    );

    console.log('[RenderHome] Complete home UI rendered successfully');
}

/**
 * Export default per import aggregato
 */
export default {
    renderHome,
};
