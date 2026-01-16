/**
 * AUTH VIEW - DOM References
 * 
 * RESPONSABILITÀ:
 * - Query e cache riferimenti DOM
 * - ZERO logica business
 * - ZERO mutazioni stato
 * 
 * ARCHITETTURA:
 * - Esegue querySelector una volta sola
 * - Esporta oggetto con riferimenti
 * - Usato da auth.render.js e auth.actions.js
 * 
 * UTILIZZO:
 * import { authView, initAuthView } from './auth.view.js';
 */

/**
 * CACHE RIFERIMENTI DOM
 */
export const authView = {
    // Root
    root: null,
    
    // Auth Card
    authCard: null,
    
    // Tabs (segmented control)
    loginTab: null,
    signupTab: null,
    
    // Form container
    formContainer: null,
    
    // Forms (verranno popolati dopo render)
    loginForm: null,
    signupForm: null,
    
    // Submit buttons
    loginSubmitBtn: null,
    signupSubmitBtn: null,
};

/**
 * Inizializza riferimenti DOM
 * Chiamata da auth.js dopo DOM ready
 */
export function initAuthView() {
    console.log('[AuthView] Initializing DOM references...');
    
    // Root
    authView.root = document.getElementById('auth-root');
    if (!authView.root) {
        console.error('[AuthView] CRITICAL: #auth-root not found');
        return false;
    }
    
    // Tabs
    authView.loginTab = document.querySelector('[data-tab="login"]');
    authView.signupTab = document.querySelector('[data-tab="signup"]');
    
    // Form container
    authView.formContainer = document.getElementById('auth-form-container');
    
    // Validation
    _validateRefs();
    
    console.log('[AuthView] DOM references initialized');
    return true;
}

/**
 * Aggiorna riferimenti form dopo render
 * Chiamata da auth.render.js dopo aver iniettato HTML
 */
export function updateFormRefs() {
    // Forms
    authView.loginForm = document.getElementById('login-form');
    authView.signupForm = document.getElementById('signup-form');
    
    // Submit buttons
    authView.loginSubmitBtn = authView.loginForm?.querySelector('[data-submit="login"]');
    authView.signupSubmitBtn = authView.signupForm?.querySelector('[data-submit="signup"]');
    
    console.log('[AuthView] Form references updated');
}

/**
 * Valida che i riferimenti critici esistano
 */
function _validateRefs() {
    const criticalRefs = [
        { name: 'root', ref: authView.root },
        { name: 'loginTab', ref: authView.loginTab },
        { name: 'signupTab', ref: authView.signupTab },
        { name: 'formContainer', ref: authView.formContainer },
    ];
    
    let allValid = true;
    
    criticalRefs.forEach(({ name, ref }) => {
        if (!ref) {
            console.warn(`[AuthView] Missing critical ref: ${name}`);
            allValid = false;
        }
    });
    
    return allValid;
}

/**
 * Helper: ottieni riferimento campo input
 */
export function getFieldInput(field) {
    const form = authView.loginForm || authView.signupForm;
    if (!form) return null;
    
    return form.querySelector(`[data-field="${field}"]`);
}

/**
 * Helper: ottieni riferimento errore campo
 */
export function getFieldError(field) {
    const form = authView.loginForm || authView.signupForm;
    if (!form) return null;
    
    return form.querySelector(`[data-error="${field}"]`);
}
