/**
 * MOCKUP DATA FOR HOME PAGE TESTING
 *
 * Contiene dati fittizi per verificare il funzionamento della home page.
 * Due versioni: utente loggato con 4 ordini e utente non loggato.
 *
 * USO:
 * import { getHomeMockup } from './mockup/dataHomeMockUp.js';
 * const mockData = getHomeMockup('loggedIn'); // o 'notLoggedIn'
 * // Poi usa mockData per popolare homeState
 */

const mockupData = {
  /**
   * VERSIONE: Utente loggato con 4 ordini per il giorno corrente (15 gennaio 2026)
   */
  loggedIn: {
    user: {
      authenticated: true,
      enabled: true,
      name: 'John Doe',
    },
    sidebarOpen: false,
    todayService: {
      status: 'active',
      location: 'Engineering Hub',
      startTime: '10:00 AM',
      endTime: '2:00 PM',
      queueTime: 15,
    },
    selectedDayId: '2026-01-15',
    monthLabel: 'January 2026',
    weekDays: [
      { id: '2026-01-12', weekday: 'SUN', dayNumber: '12', isToday: false, isActive: true, isDisabled: false, isSelected: false },
      { id: '2026-01-13', weekday: 'MON', dayNumber: '13', isToday: false, isActive: true, isDisabled: false, isSelected: false },
      { id: '2026-01-14', weekday: 'TUE', dayNumber: '14', isToday: false, isActive: true, isDisabled: false, isSelected: false },
      { id: '2026-01-15', weekday: 'WED', dayNumber: '15', isToday: true, isActive: true, isDisabled: false, isSelected: true },
      { id: '2026-01-16', weekday: 'THU', dayNumber: '16', isToday: false, isActive: true, isDisabled: false, isSelected: false },
      { id: '2026-01-17', weekday: 'FRI', dayNumber: '17', isToday: false, isActive: true, isDisabled: false, isSelected: false },
      { id: '2026-01-18', weekday: 'SAT', dayNumber: '18', isToday: false, isActive: true, isDisabled: false, isSelected: false },
    ],
    ordersPreview: {
      // Questo verrà computato da computeOrdersPreviewState con i rawOrders qui sotto
      // variant: 'multi', ordersCount: 4, selectedOrder: { id: 123, status: 'ready', statusLabel: 'READY AT 12:00 PM' }
    },
    rawOrders: [
      { id: 123, status: 'ready', pickup_time: '12:00 PM' },
      { id: 124, status: 'confirmed', pickup_time: '1:00 PM' },
      { id: 125, status: 'pending' },
      { id: 126, status: 'picked_up' },
    ],
    booking: {
      dateLabel: 'Tomorrow, January 16',
      locationLabel: 'Engineering Hub',
      slots: [
        { id: 1, timeLabel: '11:00 AM', slotsLeft: 8, href: '/orders/create?slot=1', isDisabled: false },
        { id: 2, timeLabel: '11:30 AM', slotsLeft: 3, href: '/orders/create?slot=2', isDisabled: false },
        { id: 3, timeLabel: '12:00 PM', slotsLeft: 0, href: null, isDisabled: true },
        { id: 4, timeLabel: '12:30 PM', slotsLeft: 12, href: '/orders/create?slot=4', isDisabled: false },
        { id: 5, timeLabel: '1:00 PM', slotsLeft: 1, href: '/orders/create?slot=5', isDisabled: false },
      ],
    },
  },

  /**
   * VERSIONE: Utente non loggato
   */
  notLoggedIn: {
    user: {
      authenticated: false,
      enabled: false,
      name: null,
    },
    sidebarOpen: false,
    todayService: {
      status: 'active',
      location: 'Engineering Hub',
      startTime: '10:00 AM',
      endTime: '2:00 PM',
      queueTime: 20,
    },
    selectedDayId: '2026-01-15',
    monthLabel: 'January 2026',
    weekDays: [
      { id: '2026-01-12', weekday: 'SUN', dayNumber: '12', isToday: false, isActive: true, isDisabled: false, isSelected: false },
      { id: '2026-01-13', weekday: 'MON', dayNumber: '13', isToday: false, isActive: true, isDisabled: false, isSelected: false },
      { id: '2026-01-14', weekday: 'TUE', dayNumber: '14', isToday: false, isActive: true, isDisabled: false, isSelected: false },
      { id: '2026-01-15', weekday: 'WED', dayNumber: '15', isToday: true, isActive: true, isDisabled: false, isSelected: true },
      { id: '2026-01-16', weekday: 'THU', dayNumber: '16', isToday: false, isActive: true, isDisabled: false, isSelected: false },
      { id: '2026-01-17', weekday: 'FRI', dayNumber: '17', isToday: false, isActive: true, isDisabled: false, isSelected: false },
      { id: '2026-01-18', weekday: 'SAT', dayNumber: '18', isToday: false, isActive: true, isDisabled: false, isSelected: false },
    ],
    ordersPreview: {
      // Questo verrà computato come 'login-cta'
      // variant: 'login-cta', ordersCount: 0, selectedOrder: null
    },
    rawOrders: [], // Nessun ordine per utente non loggato
    booking: {
      dateLabel: 'Tomorrow, January 16',
      locationLabel: 'Engineering Hub',
      slots: [
        { id: 1, timeLabel: '11:00 AM', slotsLeft: 8, href: '/login', isDisabled: false },
        { id: 2, timeLabel: '11:30 AM', slotsLeft: 3, href: '/login', isDisabled: false },
        { id: 3, timeLabel: '12:00 PM', slotsLeft: 0, href: null, isDisabled: true },
        { id: 4, timeLabel: '12:30 PM', slotsLeft: 12, href: '/login', isDisabled: false },
      ],
    },
  },
};

/**
 * Restituisce i dati mockup per il tipo specificato.
 *
 * @param {string} type - 'loggedIn' o 'notLoggedIn'
 * @returns {object} - Oggetto con i dati mockup
 */
function getHomeMockup(type) {
  if (!mockupData[type]) {
    throw new Error(`Mockup type '${type}' not found. Available: ${Object.keys(mockupData).join(', ')}`);
  }
  return mockupData[type];
}

export { getHomeMockup };