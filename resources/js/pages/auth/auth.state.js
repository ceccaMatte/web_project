/**
 * AUTH STATE - Single Source of Truth
 * 
 * RESPONSABILITÀ:
 * - Definisce struttura authState (SOLO dati, MAI riferimenti DOM)
 * - Fornisce helper per mutation sicure dello stato
 * 
 * ARCHITETTURA:
 * - Centralizza lo stato della pagina Auth
 * - Esportato e importato da auth.js, auth.hydration.js, auth.actions.js
 * - I componenti NON importano questo modulo (ricevono props)
 * 
 * UTILIZZO:
 * import { authState, mutateMode, mutateForm, mutateValidation } from './auth.state.js';
 */

/**
 * STATO GLOBALE PAGINA AUTH (SSOT)
 * 
 * Contiene SOLO dati primitivi e serializzabili.
 * MAI riferimenti DOM, funzioni, o oggetti complessi.
 */
export const authState = {
    /**
     * Mode: 'login' | 'signup'
     * - Determina quale form mostrare
     */
    mode: 'login',

    /**
     * Form data
     * - Valori dei campi input
     */
    form: {
        nickname: '',
        email: '',
        password: '',
    },

    /**
     * Validation state
     * - Errori per campo
     * - isValid: true se form è valido
     */
    validation: {
        nickname: null, // string errore o null
        email: null,
        password: null,
        isValid: false,
    },

    /**
     * Submit state
     * - loading: boolean - submit in corso
     * - error: string|null - errore server
     */
    submit: {
        loading: false,
        error: null,
    },
};

/**
 * MUTATION HELPERS
 * 
 * Funzioni helper per modificare lo stato in modo type-safe.
 * Usate da auth.actions.js.
 */

/**
 * Cambia mode (login ↔ signup)
 */
export function mutateMode(newMode) {
    if (newMode !== 'login' && newMode !== 'signup') {
        console.error('[AuthState] Invalid mode:', newMode);
        return;
    }
    
    authState.mode = newMode;
    
    // Reset form e validation quando cambia mode
    authState.form.nickname = '';
    authState.form.email = '';
    authState.form.password = '';
    authState.validation.nickname = null;
    authState.validation.email = null;
    authState.validation.password = null;
    authState.validation.isValid = false;
    authState.submit.error = null;
    
    console.log('[AuthState] Mode changed to:', newMode);
}

/**
 * Aggiorna singolo campo form
 */
export function mutateFormField(field, value) {
    if (!(field in authState.form)) {
        console.error('[AuthState] Invalid field:', field);
        return;
    }
    
    authState.form[field] = value;
}

/**
 * Aggiorna validation per campo
 */
export function mutateValidationError(field, error) {
    if (!(field in authState.validation)) {
        console.error('[AuthState] Invalid validation field:', field);
        return;
    }
    
    authState.validation[field] = error;
}

/**
 * Aggiorna stato isValid
 */
export function mutateIsValid(isValid) {
    authState.validation.isValid = isValid;
}

/**
 * Aggiorna stato submit
 */
export function mutateSubmitState(loading, error = null) {
    authState.submit.loading = loading;
    authState.submit.error = error;
}

/**
 * Reset completo validation
 */
export function resetValidation() {
    authState.validation.nickname = null;
    authState.validation.email = null;
    authState.validation.password = null;
    authState.validation.isValid = false;
}

/**
 * Reset completo form
 */
export function resetForm() {
    authState.form.nickname = '';
    authState.form.email = '';
    authState.form.password = '';
    resetValidation();
}

/**
 * LOG STATE (debug only)
 */
export function logAuthState() {
    console.log('[AuthState] Current state:', JSON.parse(JSON.stringify(authState)));
}
