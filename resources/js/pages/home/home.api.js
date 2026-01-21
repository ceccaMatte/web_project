// Home API: thin fetch wrappers for the home page

/**
 * Fetch dati completi Home page
 * 
 * ENDPOINT: GET /api/home
 * 
 * RESPONSE: {
 *   user: { authenticated, enabled, name },
 *   todayService: { status, location, startTime, endTime, queueTime },
 *   scheduler: { selectedDayId, monthLabel, weekDays },
 *   ordersPreview: { variant, ordersCount, selectedOrder },
 *   booking: { dateLabel, locationLabel, slots }
 * }
 * 
 * @returns {Promise<Object>} - Home payload completo
 * @throws {Error} - Se fetch fallisce o response non ok
 */
export async function fetchHome() {
    try {
        const response = await fetch('/api/home', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Invia cookie di sessione
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch /api/home:', error);
        throw error;
    }
}

/**
 * Fetch slot prenotabili per un giorno specifico
 * 
 * ENDPOINT: GET /api/booking?day=YYYY-MM-DD
 * 
 * TODO: Implementare endpoint backend se non esiste.
 * 
 * RESPONSE ATTESA: {
 *   dateLabel: "Friday, January 16",
 *   locationLabel: "Engineering Hub",
 *   slots: [
 *     {
 *       id: 13,
 *       timeLabel: "11:00",
 *       slotsLeft: 45,
 *       href: "/orders/create?slot=13",
 *       isDisabled: false
 *     },
 *     ...
 *   ]
 * }
 * 
 * @param {string} dayId - Data nel formato YYYY-MM-DD (es. "2026-01-16")
 * @returns {Promise<Object>} - Booking payload per il giorno
 * @throws {Error} - Se fetch fallisce o response non ok
 */
export async function fetchBookingForDay(dayId) {
    if (!dayId) {
        throw new Error('fetchBookingForDay: dayId is required');
    }
    try {
        const response = await fetch(`/api/booking?day=${dayId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch booking for', dayId, error);
        throw error;
    }
}

/**
 * Logout utente corrente
 * 
 * ENDPOINT: POST /logout
 * 
 * RESPONSE: {
 *   success: true,
 *   message?: string
 * }
 * 
 * @returns {Promise<Object>} - {success: boolean, message?: string}
 * @throws {Error} - Se fetch fallisce o response non ok
 */
export async function logoutUser() {
    try {
        // Ottieni CSRF token da meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        if (!csrfToken) {
            console.error('CSRF token not found in meta tag');
            throw new Error('CSRF token not found');
        }
        
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            credentials: 'same-origin',
        });
        
        // Gestione esplicita 419 CSRF Token Mismatch
        if (response.status === 419) {
            console.error('CSRF token mismatch (419)');
            return {
                success: false,
                message: 'Session expired. Please refresh the page.',
                error: 'csrf_mismatch',
            };
        }
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Logout failed:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to logout:', error);
        throw error;
    }
}

/**
 * Fetch time slots per un giorno specifico
 * 
 * ENDPOINT: GET /api/time-slots?date=YYYY-MM-DD
 * 
 * RESPONSE: {
 *   dateLabel: "Friday, January 16",
 *   locationLabel: "Engineering Hub",
 *   slots: [
 *     {
 *       id: 13,
 *       timeLabel: "11:00",
 *       slotsLeft: 45,
 *       href: "/orders/create?slot=13",
 *       isDisabled: false
 *     },
 *     ...
 *   ]
 * }
 * 
 * @param {string} date - Data nel formato YYYY-MM-DD (es. "2026-01-16")
 * @returns {Promise<Object>} - Time slots payload per il giorno
 * @throws {Error} - Se fetch fallisce o response non ok
 */
export async function fetchTimeSlots(date) {
    if (!date) {
        throw new Error('fetchTimeSlots: date is required');
    }
    try {
        const response = await fetch(`/api/time-slots?date=${date}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Invia cookie di sessione
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch time slots for', date, error);
        throw error;
    }
}

/**
 * Fetch polling per aggiornamenti automatici ogni 5 secondi
 * 
 * ENDPOINT: GET /api/home/polling?date=YYYY-MM-DD
 * 
 * Questo endpoint serve ESCLUSIVAMENTE per il polling automatico.
 * Ritorna SOLO i dati necessari per aggiornare:
 * - Truck Card (SEMPRE today)
 * - Ordini utente (SOLO today) 
 * - Time slots (del giorno selezionato)
 * 
 * RESPONSE: {
 *   today: {
 *     is_active: boolean,
 *     location: string,
 *     start_time: string,
 *     end_time: string
 *   },
 *   user_orders_today: [
 *     { id: number, status: string }
 *   ],
 *   selected_day_slots: [
 *     { time: string, available: number, id: number, href: string }
 *   ]
 * }
 * 
 * @param {string} selectedDate - Data selezionata per i time slots (YYYY-MM-DD)
 * @returns {Promise<Object>} - Polling payload leggero
 * @throws {Error} - Se fetch fallisce o response non ok
 */
export async function fetchPolling(selectedDate) {
    if (!selectedDate) {
        throw new Error('fetchPolling: selectedDate is required');
    }
    try {
        const response = await fetch(`/api/home/polling?date=${selectedDate}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Cookie di sessione
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Polling failed for', selectedDate, error);
        throw error;
    }
}

/**
 * Export default per import aggregato
 */
export default {
    fetchHome,
    fetchBookingForDay,
    logoutUser,
    fetchTimeSlots,
    fetchPolling,
};
