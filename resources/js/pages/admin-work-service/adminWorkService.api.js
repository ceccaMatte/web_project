/**
 * ADMIN WORK SERVICE API LAYER
 * 
 * RESPONSABILITÀ:
 * - Gestisce comunicazione HTTP con backend
 * - Centralizza endpoint API per Admin Work Service
 * - Fornisce error handling consistente
 * 
 * ENDPOINTS:
 * - GET /api/admin/work-service?date=YYYY-MM-DD → Fetch iniziale
 * - GET /api/admin/work-service/poll?date=YYYY-MM-DD → Polling
 * - POST /api/admin/orders/{order}/status → Cambio stato
 */

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

    const startTime = performance.now();
    console.log(`[WorkServiceAPI] 🚀 START fetch /api/admin/work-service?date=${date} at ${startTime}ms`);

    try {
        const fetchStartTime = performance.now();
        const response = await fetch(`/api/admin/work-service?date=${date}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        const fetchEndTime = performance.now();
        console.log(`[WorkServiceAPI] 🌐 Network request completed in ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const parseStartTime = performance.now();
        const data = await response.json();
        const parseEndTime = performance.now();
        console.log(`[WorkServiceAPI] 📝 JSON parsing completed in ${(parseEndTime - parseStartTime).toFixed(2)}ms`);
        
        const totalTime = performance.now() - startTime;
        console.log(`[WorkServiceAPI] ✅ COMPLETE fetch for ${date} in ${totalTime.toFixed(2)}ms:`, {
            timeSlots: data.timeSlots?.length || 0,
            orders: data.orders?.length || 0,
            currentTimeSlotId: data.currentTimeSlotId,
            networkTime: (fetchEndTime - fetchStartTime).toFixed(2) + 'ms',
            parseTime: (parseEndTime - parseStartTime).toFixed(2) + 'ms',
            totalTime: totalTime.toFixed(2) + 'ms'
        });
        
        return data;
    } catch (error) {
        const totalTime = performance.now() - startTime;
        console.error(`[WorkServiceAPI] ❌ FAILED fetch for ${date} after ${totalTime.toFixed(2)}ms:`, error);
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

    const startTime = performance.now();
    console.log(`[WorkServiceAPI] 🔄 START poll /api/admin/work-service/poll?date=${date} at ${startTime}ms`);

    try {
        const fetchStartTime = performance.now();
        const response = await fetch(`/api/admin/work-service/poll?date=${date}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        const fetchEndTime = performance.now();
        console.log(`[WorkServiceAPI] 🌐 Poll network request completed in ${(fetchEndTime - fetchStartTime).toFixed(2)}ms`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const parseStartTime = performance.now();
        const data = await response.json();
        const parseEndTime = performance.now();
        console.log(`[WorkServiceAPI] 📝 Poll JSON parsing completed in ${(parseEndTime - parseStartTime).toFixed(2)}ms`);
        
        const totalTime = performance.now() - startTime;
        console.log(`[WorkServiceAPI] ✅ COMPLETE poll for ${date} in ${totalTime.toFixed(2)}ms:`, {
            timeSlots: data.timeSlots?.length || 0,
            orders: data.orders?.length || 0,
            networkTime: (fetchEndTime - fetchStartTime).toFixed(2) + 'ms',
            parseTime: (parseEndTime - parseStartTime).toFixed(2) + 'ms',
            totalTime: totalTime.toFixed(2) + 'ms'
        });
        
        return data;
    } catch (error) {
        console.error(`[WorkServiceAPI] Polling failed for ${date}:`, error);
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
    if (!orderId || !newStatus) {
        throw new Error('[WorkServiceAPI] changeOrderStatus: orderId and newStatus are required');
    }

    console.log(`[WorkServiceAPI] POST /api/admin/orders/${orderId}/status -> ${newStatus}`);

    try {
        // Get CSRF token
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
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[WorkServiceAPI] Order ${orderId} status changed to ${newStatus}`);
        
        return data;
    } catch (error) {
        console.error(`[WorkServiceAPI] Failed to change status for order ${orderId}:`, error);
        throw error;
    }
}

export default { fetchWorkServiceData, pollWorkServiceData, changeOrderStatus };
