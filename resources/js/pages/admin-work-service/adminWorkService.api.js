// API helper for admin work service

/**
 * Fetch dati iniziali per una data
 * 
 * ENDPOINT: GET /api/admin/work-service?date=YYYY-MM-DD
 * 
 * RESPONSE: {
 *   date: "2026-01-08",
 *   currentTimeSlotId: number | null,
 *   timeSlots: [...],
 *   orders: [...]
 * }
 * 
 * @param {string} date - Data nel formato YYYY-MM-DD
 * @returns {Promise<Object>} - Dati work service
 */
export async function fetchWorkServiceData(date) {
    if (!date) {
        throw new Error('[WorkServiceAPI] fetchWorkServiceData: date is required');
    }

    try {
        const response = await fetch(`/api/admin/work-service?date=${date}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch work service data for ${date}:`, error);
        throw error;
    }
}

/**
 * Polling endpoint - stessa struttura di fetchWorkServiceData
 * 
 * ENDPOINT: GET /api/admin/work-service/poll?date=YYYY-MM-DD
 * 
 * @param {string} date - Data nel formato YYYY-MM-DD
 * @returns {Promise<Object>} - Dati work service aggiornati
 */
export async function pollWorkServiceData(date) {
    if (!date) {
        throw new Error('[WorkServiceAPI] pollWorkServiceData: date is required');
    }

    try {
        const response = await fetch(`/api/admin/work-service/poll?date=${date}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Polling failed for ${date}:`, error);
        throw error;
    }
}

/**
 * Cambia stato di un ordine
 * 
 * ENDPOINT: POST /api/admin/orders/{order}/status
 * BODY: { status: "ready" | "picked_up" | ... }
 * 
 * RESPONSE: {
 *   success: true,
 *   order: { id, status }
 * }
 * 
 * @param {number} orderId - ID ordine
 * @param {string} newStatus - Nuovo stato
 * @returns {Promise<Object>} - Response
 */
export async function changeOrderStatus(orderId, newStatus) {
    if (!orderId || !newStatus) throw new Error('orderId and newStatus are required');

    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken || '',
            },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.error || `HTTP error! status: ${response.status}`;
            throw new Error(message);
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to change status for order ${orderId}:`, error);
        throw error;
    }
}

export default { fetchWorkServiceData, pollWorkServiceData, changeOrderStatus };
