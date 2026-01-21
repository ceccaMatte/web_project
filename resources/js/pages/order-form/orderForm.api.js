// HTTP layer for order form

/**
 * Ottiene CSRF token dal meta tag
 */
function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

/**
 * Fetch dati per CREATE mode.
 * 
 * GET /api/orders/form/create?date=YYYY-MM-DD
 * 
 * @param {string} date - Data selezionata
 * @returns {Promise<Object>} Payload create
 */
export async function fetchCreateData(date) {
    
    const url = `/api/orders/form/create?date=${date}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch create data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
}

/**
 * Fetch dati per MODIFY mode.
 * 
 * GET /api/orders/{orderId}/form
 * 
 * @param {number} orderId - ID ordine
 * @returns {Promise<Object>} Payload modify
 */
export async function fetchModifyData(orderId) {
    
    const url = `/api/orders/${orderId}/form`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    });
    
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Non autorizzato a modificare questo ordine');
        }
        if (response.status === 422) {
            throw new Error('Ordine non modificabile');
        }
        throw new Error(`Failed to fetch modify data: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
}

/**
 * Fetch disponibilità aggiornata (per polling).
 * 
 * GET /api/orders/form/availability?date=YYYY-MM-DD
 * 
 * @param {string|null} date - Data per time slots (null = solo ingredienti)
 * @returns {Promise<Object>} Availability data
 */
export async function fetchAvailability(date = null) {
    let url = '/api/orders/form/availability';
    if (date) {
        url += `?date=${date}`;
    }
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
}

/**
 * Crea un nuovo ordine.
 * 
 * POST /orders
 * Body: { time_slot_id, ingredients[] }
 * 
 * @param {number} timeSlotId - ID slot selezionato
 * @param {Array<number>} ingredientIds - IDs ingredienti selezionati
 * @returns {Promise<Object>} Response con ordine creato
 */
export async function createOrder(timeSlotId, ingredientIds) {
    
    const response = await fetch('/orders', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            time_slot_id: timeSlotId,
            ingredients: ingredientIds,
        }),
    });
    
    const data = await response.json();
    if (!response.ok) {
        console.error('Create failed:', data);
        throw new Error(data.message || 'Creazione ordine fallita');
    }
    return data;
}

/**
 * Aggiorna un ordine esistente.
 * 
 * PUT /orders/{orderId}
 * Body: { ingredients[] }
 * 
 * @param {number} orderId - ID ordine
 * @param {Array<number>} ingredientIds - IDs ingredienti selezionati
 * @returns {Promise<Object>} Response con ordine aggiornato
 */
export async function updateOrder(orderId, ingredientIds) {
    
    const response = await fetch(`/orders/${orderId}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            ingredients: ingredientIds,
        }),
    });
    
    const data = await response.json();
    if (!response.ok) {
        console.error('Update failed:', data);
        throw new Error(data.message || 'Aggiornamento ordine fallito');
    }
    return data;
}

/**
 * Elimina un ordine.
 * 
 * DELETE /orders/{orderId}
 * 
 * @param {number} orderId - ID ordine
 * @returns {Promise<Object>} Response
 */
export async function deleteOrder(orderId) {
    
    const response = await fetch(`/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
    });
    
    const data = await response.json();

    if (!response.ok) {
        console.error('Delete failed:', data);
        throw new Error(data.message || 'Eliminazione ordine fallita');
    }

    return data;
}

export default {
    fetchCreateData,
    fetchModifyData,
    fetchAvailability,
    createOrder,
    updateOrder,
    deleteOrder,
};
