// Actions for Orders page

import { ordersState, mutateSidebar, mutateSelectedDay, mutateActiveOrders, toggleExpandedOrder, toggleFavoritesFilter, mutateOrderFavorite, navigateCarousel, resetCarouselIndex, mutateUser } from './orders.state.js';
import { ordersView } from './orders.view.js';
import { fetchActiveOrders, toggleFavorite as toggleFavoriteApi } from './orders.api.js';
import { logoutUser } from '../../pages/home/home.api.js';

export function openSidebar() {
    mutateSidebar(true);
    
    // re-render
    import('./orders.render.js').then(({ renderSidebarAndTopbar }) => {
        renderSidebarAndTopbar();
    });
}

export function closeSidebar() {
    mutateSidebar(false);
    
    // re-render
    import('./orders.render.js').then(({ renderSidebarAndTopbar }) => {
        renderSidebarAndTopbar();
    });
}

export async function selectDay(dayId) {
    if (!dayId) {
        console.warn('[Actions] selectDay: dayId is required');
        return;
    }

    mutateSelectedDay(dayId);
    // reset carousel index
    resetCarouselIndex();
    const { renderScheduler } = await import('./orders.render.js');
    renderScheduler();

    // fetch active orders for selected day
    try {
        const activeOrders = await fetchActiveOrders(dayId);
        mutateActiveOrders(activeOrders);
        const { renderActiveOrdersSection } = await import('./orders.render.js');
        renderActiveOrdersSection();
    } catch (error) {
        console.error('Failed to fetch active orders:', error);
        mutateActiveOrders([]);
        const { renderActiveOrdersSection } = await import('./orders.render.js');
        renderActiveOrdersSection();
    }
}

export function navigateActiveOrdersCarousel(direction) {
    navigateCarousel(direction);
    
    import('./orders.render.js').then(({ renderActiveOrdersSection }) => {
        renderActiveOrdersSection();
    });
}

export function toggleOrderExpand(orderId) {
    toggleExpandedOrder(orderId);
    
    // re-render affected sections
    import('./orders.render.js').then(({ renderActiveOrdersSection, renderRecentOrdersSection }) => {
        renderActiveOrdersSection();
        renderRecentOrdersSection();
    });
}

export async function toggleOrderFavorite(orderId, configId) {
    if (!configId) {
        console.warn('[Actions] toggleOrderFavorite: configId is required');
        return;
    }

    try {
        const result = await toggleFavoriteApi(configId);
        mutateOrderFavorite(orderId, result.is_favorite);
        import('./orders.render.js').then(({ renderActiveOrdersSection, renderRecentOrdersSection }) => {
            renderActiveOrdersSection();
            renderRecentOrdersSection();
        });
    } catch (error) {
        console.error('Failed to toggle favorite:', error);
    }
}

export function toggleFavoritesOnly() {
    toggleFavoritesFilter();
    
    import('./orders.render.js').then(({ renderRecentOrdersSection }) => {
        renderRecentOrdersSection();
    });
}

export function navigateToCreate(configId = null) {
    // redirect to create (optionally with config)
    if (configId) {
        window.location.href = `/orders/create?config=${configId}`;
    } else {
        window.location.href = '/orders/create';
    }
}

export function navigateToModify(orderId) {
    if (!orderId) {
        console.warn('[Actions] navigateToModify: orderId is required');
        return;
    }
    
    window.location.href = `/orders/${orderId}/edit`;
}

export function goBack() {
    window.location.href = '/';
}

export async function logout() {
    try {
        const response = await logoutUser();
        if (response.success) {
            mutateUser({ authenticated: false, enabled: false, name: null });
            window.location.href = '/';
        } else {
            console.error('Logout failed:', response);
        }
    } catch (error) {
        console.error('Logout request failed:', error);
    }
}

export function reorder(orderId) {
    if (orderId) {
        window.location.href = `/orders/create?reorder=${orderId}`;
    } else {
        window.location.href = '/orders/create';
    }
}

export default {
    openSidebar,
    closeSidebar,
    selectDay,
    navigateActiveOrdersCarousel,
    toggleOrderExpand,
    toggleOrderFavorite,
    toggleFavoritesOnly,
    navigateToCreate,
    navigateToModify,
    goBack,
    reorder,
    logout,
};
