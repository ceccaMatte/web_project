// Orders API helpers

// GET /api/orders?date=YYYY-MM-DD
export async function fetchActiveOrders(date) {
    if (!date) {
        throw new Error('[OrdersAPI] fetchActiveOrders: date is required');
    }


    try {
        const response = await fetch(`/api/orders?date=${date}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.orders || [];
    } catch (error) {
        console.error(`[OrdersAPI] Failed to fetch active orders for ${date}:`, error);
        throw error;
    }
}

// GET /api/orders/recent
export async function fetchRecentOrders() {
    try {
        const response = await fetch('/api/orders/recent', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.orders || [];
    } catch (error) {
        console.error('[OrdersAPI] Failed to fetch recent orders:', error);
        throw error;
    }
}

// GET /api/orders/init?date=YYYY-MM-DD
export async function fetchOrdersPageData(date = null) {
    const url = date 
        ? `/api/orders/init?date=${date}` 
        : '/api/orders/init';
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[OrdersAPI] Failed to fetch orders page data:', error);
        throw error;
    }
}

// POST /api/favorites/toggle
export async function toggleFavorite(configId) {
    if (!configId) {
        throw new Error('[OrdersAPI] toggleFavorite: configId is required');
    }

    try {
        // Ottieni CSRF token da meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        if (!csrfToken) {
            console.warn('[OrdersAPI] CSRF token not found');
        }

        const response = await fetch('/api/favorites/toggle', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken || '',
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                ingredient_configuration_id: configId,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`[OrdersAPI] Failed to toggle favorite for config ${configId}:`, error);
        throw error;
    }
}

/**
 * Export default per import aggregato
 */
export default {
    fetchActiveOrders,
    fetchRecentOrders,
    fetchOrdersPageData,
    toggleFavorite,
};
